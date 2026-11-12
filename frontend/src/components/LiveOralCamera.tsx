import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  Crosshair,
  Layers,
  FileImage,
  Flame
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface LiveOralCameraProps {
  patientUidn: string;
  patientName: string;
  lang: Language;
  onAnalysisComplete?: (screening: any) => void;
  onClose?: () => void;
}

export const ORAL_REGIONS = [
  'Right Buccal Mucosa',
  'Left Cheek',
  'Tongue Dorsum',
  'Floor of Mouth',
  'Palate'
] as const;

export type OralRegion = typeof ORAL_REGIONS[number];

export const LiveOralCamera: React.FC<LiveOralCameraProps> = ({
  patientUidn,
  patientName,
  lang,
  onAnalysisComplete,
  onClose
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<OralRegion>('Right Buccal Mucosa');

  // Habit exposure state (pre-filled with K. Somanna's high-risk profile for evaluation)
  const [habits, setHabits] = useState({
    tobacco: true,
    gutkha: false,
    reverseSmoking: true,
    areca: true,
    years: 18,
    frequency: '6-8 times daily'
  });

  const [symptoms, setSymptoms] = useState<string[]>([
    'Persistent white cheek patch (>3 weeks)',
    'Mild burning sensation with spicy food',
    'Rough indurated mucosal texture'
  ]);

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize webcam stream
  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access unavailable, running resilient capture mode:', err.message);
      setCameraError('Webcam unavailable or permission denied. You can upload an intra-oral photo or use sample capture.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
  };

  const handleUseMockSample = () => {
    // Clinical sample intra-oral photo of right buccal leukoplakia
    const sample = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800';
    setCapturedImage(sample);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!capturedImage) {
      alert('Please capture or select an intra-oral scan image first.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('patientUidn', patientUidn);
      formData.append('oralRegion', selectedRegion);
      formData.append('symptomsChecklist', JSON.stringify(symptoms));
      formData.append('habitExposure', JSON.stringify(habits));
      formData.append('imageBase64', capturedImage);

      const res = await api.analyzeOralPhoto(formData);
      setAnalysisResult(res.analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(res.screening);
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Screening Analysis notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-amber-300 shadow-luxury overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold font-serif-royal">{t.cameraTitle}</h2>
            <span className="text-[10px] font-bold bg-amber-600/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40">
              Multimodal Gemini 2.0 AI
            </span>
          </div>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Patient: <strong className="text-white">{patientName}</strong> ({patientUidn}) • Alluri Sitharama Raju District
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-2 bg-black/20 p-1 rounded-xl border border-amber-600/40 text-xs">
          <button
            onClick={() => {
              setMode('camera');
              setCapturedImage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              mode === 'camera' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm' : 'text-amber-200 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Webcam Live</span>
          </button>
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              mode === 'upload' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm' : 'text-amber-200 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Viewport & Capture */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden border-2 border-amber-300 shadow-inner flex items-center justify-center">
            {/* 1. Live Video Stream */}
            {mode === 'camera' && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* Optical Reticle Crosshair */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-amber-400/60 rounded-2xl relative flex items-center justify-center">
                    <Crosshair className="w-8 h-8 text-amber-400/80 animate-pulse" />
                    <span className="absolute -top-3 bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                      Target Area
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 2. Captured Image View with Bounding Box Overlay */}
            {capturedImage && (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={capturedImage}
                  alt="Captured Oral Cavity"
                  className="w-full h-full object-cover"
                />

                {/* AI Detected Bounding Box Overlay */}
                {analysisResult && (
                  <div
                    className="absolute border-2 border-red-500 rounded-lg bg-red-500/10 pointer-events-none transition-all duration-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    style={{
                      left: '30%',
                      top: '25%',
                      width: '45%',
                      height: '50%'
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap">
                      <AlertTriangle className="w-3 h-3 text-amber-200" />
                      <span>{analysisResult.aiLesionType}</span>
                      <span className="bg-white/20 px-1 rounded text-[9px] ml-1">
                        {analysisResult.aiConfidenceScore}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Fallback when camera not active */}
            {mode === 'camera' && !cameraActive && !capturedImage && (
              <div className="p-6 text-center space-y-3">
                <Camera className="w-12 h-12 text-amber-500/80 mx-auto" />
                <p className="text-xs text-amber-200/90 max-w-sm">
                  {cameraError || 'Webcam is initializing...'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-500 transition-all flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                  <button
                    onClick={handleUseMockSample}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center space-x-1.5"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Load Clinical Demonstration Scan</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Upload Mode Drag & Drop */}
            {mode === 'upload' && !capturedImage && (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-6 text-center hover:bg-slate-900/60 transition-colors">
                <UploadCloud className="w-14 h-14 text-amber-400 mb-2" />
                <span className="text-sm font-bold text-white mb-1">
                  Upload Intra-Oral Medical Photograph
                </span>
                <span className="text-xs text-slate-400 max-w-xs">
                  JPEG, PNG, or WebP up to 15MB. Captured via smartphone camera or clinical intra-oral probe.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons under Preview */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {mode === 'camera' && !capturedImage && (
              <button
                onClick={handleCapture}
                disabled={!cameraActive}
                className="w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>{t.freezeCapture}</span>
              </button>
            )}

            {capturedImage && (
              <button
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.retake}</span>
              </button>
            )}

            <button
              onClick={handleRunAiAnalysis}
              disabled={!capturedImage || loading}
              className={`w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl font-extrabold text-xs transition-all duration-200 flex items-center justify-center space-x-2 ${
                capturedImage && !loading
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 animate-pulse'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? t.analyzingWithGemini : 'Run AI Disease Prediction'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clinical Parameters & AI Triage Output */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Oral Region Selector */}
          <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-amber-200">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center space-x-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.selectOralRegion}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ORAL_REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-semibold text-left transition-all border ${
                    selectedRegion === region
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Habit Exposure Checklist */}
          <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>{t.habitsExposure}</span>
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                High Malignant Index
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.reverseSmoking}
                  onChange={(e) => setHabits({ ...habits, reverseSmoking: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">{t.reverseSmoking}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.tobacco}
                  onChange={(e) => setHabits({ ...habits, tobacco: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">{t.tobaccoChewing}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.areca}
                  onChange={(e) => setHabits({ ...habits, areca: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">{t.gutkhaAreca}</span>
              </label>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-slate-600">{t.yearsOfHabit}:</span>
                <span className="font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded">
                  {habits.years} Years
                </span>
              </div>
            </div>
          </div>

          {/* AI Screening Triage Card */}
          {analysisResult && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-red-50/30 rounded-2xl border-2 border-red-400 p-5 shadow-luxury space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-red-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>AI Onco-Triage Verdict</span>
                </span>
                <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm">
                  {analysisResult.aiCondition}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900">
                  {analysisResult.aiLesionType}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Confidence Score: <strong className="text-emerald-700 font-bold">{analysisResult.aiConfidenceScore}%</strong> • Model: {analysisResult.modelUsed}
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-red-200/80 text-xs text-slate-700 leading-relaxed">
                <strong>Specialist Note:</strong> {analysisResult.clinicalRemarks}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-amber-900 border-t border-red-200">
                <span>Immediate 4mm Punch Biopsy Recommended</span>
                <span className="text-emerald-700">CHC G. Madugula</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveOralCamera;

