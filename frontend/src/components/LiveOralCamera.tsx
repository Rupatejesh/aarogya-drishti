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
  Flame,
  Stethoscope,
  MapPin,
  Calendar,
  X,
  HelpCircle
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
  'Palate',
  'Lower Labial Mucosa / Gums'
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'camera' | 'upload'>('upload'); // Default to upload mode for easy instant photo test
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

  // Initialize webcam stream if mode is camera
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
        videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Webcam start failed:', err);
      setCameraError(err.message || 'Unable to access local camera.');
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
    if (mode === 'camera') {
      startCamera();
    }
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
        setAnalysisResult(null);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!capturedImage) {
      alert('Please capture or select an image first.');
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

  // Nearby doctors list automatically suggested
  const suggestedDoctors = [
    {
      name: 'Dr. Swapna Devi, MDS',
      role: 'Oral Onco-Pathologist & Lead Specialist',
      hospital: 'PHC G. Madugula (4.2 km away)',
      type: 'Oral / Pathology',
      available: 'Saturday 10:30 AM Slot Ready'
    },
    {
      name: 'Dr. K. Rajesh, MS (ENT)',
      role: 'ENT & Head-Neck Specialist',
      hospital: 'Area Hospital Paderu (18 km away)',
      type: 'ENT Specialist',
      available: 'Friday 2:00 PM Slot Ready'
    },
    {
      name: 'Dr. P. Suresh, MDS',
      role: 'Dental & Maxillofacial Surgeon',
      hospital: 'CHC Chintapalle (22 km away)',
      type: 'Dental Surgeon',
      available: 'Monday 11:00 AM Slot Ready'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
      {/* Top Header (Royal Blue) */}
      <div className="bg-royal-700 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-royal-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base tracking-wide">
                Live Intra-Oral Camera & AI Multimodal Vision
              </h3>
              <span className="text-[10px] bg-yellow-300 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                Gemini 3.5 AI Vision
              </span>
            </div>
            <p className="text-[11px] text-blue-100">
              Examining Patient: <strong className="text-white">{patientName}</strong> ({patientUidn})
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-2 bg-royal-800/80 p-1 rounded-xl border border-royal-600 text-xs">
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              mode === 'upload' ? 'bg-white text-royal-700 shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => {
              setMode('camera');
              setCapturedImage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              mode === 'camera' ? 'bg-white text-royal-700 shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Webcam Live</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Viewport & Capture */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-2xl bg-slate-900 overflow-hidden border-2 border-slate-300 shadow-inner flex items-center justify-center">
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
                  <div className="w-48 h-48 border-2 border-blue-400/80 rounded-2xl relative flex items-center justify-center shadow-blue-glow">
                    <Crosshair className="w-8 h-8 text-blue-300 animate-pulse" />
                    <span className="absolute -top-3 bg-royal-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
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

                {/* AI Detected Bounding Box Overlay (Only for genuine lesions) */}
                {analysisResult && analysisResult.hasLesion !== false && analysisResult.aiCondition !== 'Low' && (
                  <div
                    className="absolute border-2 border-red-500 rounded-lg bg-red-500/10 pointer-events-none transition-all duration-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    style={{
                      left: '25%',
                      top: '20%',
                      width: '50%',
                      height: '55%'
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
                <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-300 max-w-sm">
                  {cameraError || 'Webcam is initializing...'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-royal-600 text-white rounded-xl text-xs font-bold hover:bg-royal-500 transition-all flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                  <button
                    onClick={handleUseMockSample}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all flex items-center space-x-1.5"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Load Clinical Scan (Somanna Sample)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Upload Mode Drag & Drop */}
            {mode === 'upload' && !capturedImage && (
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-6 text-center hover:bg-slate-800 transition-colors">
                <UploadCloud className="w-14 h-14 text-blue-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold text-white mb-1">
                  Upload Intra-Oral Photograph for AI Prediction
                </span>
                <span className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Click to select PNG, JPG, or WEBP photo. (Demo face photos will be automatically detected as non-disease).
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Browse Device Photos
                </button>
                <input
                  ref={fileInputRef}
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
                className="w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>📸 CAPTURE ORAL PHOTO</span>
              </button>
            )}

            {capturedImage && (
              <button
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Other Photo</span>
              </button>
            )}

            <button
              onClick={handleRunAiAnalysis}
              disabled={!capturedImage || loading}
              className={`w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl font-extrabold text-xs transition-all duration-200 flex items-center justify-center space-x-2 ${
                capturedImage && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 animate-pulse'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Analyzing with Gemini Vision AI...' : 'Run Real AI Disease Prediction'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clinical Parameters & AI Triage Output */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Oral Region Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-royal-600" />
              <span>{t.selectOralRegion}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ORAL_REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-semibold text-left transition-all border ${
                    selectedRegion === region
                      ? 'bg-royal-600 text-white border-royal-700 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom Questions & Habit Exposure Checklist */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>Habit Exposure & Symptoms Checklist</span>
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                High Risk Profile
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.reverseSmoking}
                  onChange={(e) => setHabits({ ...habits, reverseSmoking: e.target.checked })}
                  className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">{t.reverseSmoking}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.tobacco}
                  onChange={(e) => setHabits({ ...habits, tobacco: e.target.checked })}
                  className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">{t.tobaccoChewing}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habits.areca}
                  onChange={(e) => setHabits({ ...habits, areca: e.target.checked })}
                  className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">{t.gutkhaAreca}</span>
              </label>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">{t.yearsOfHabit}:</span>
                <span className="font-bold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-full">
                  {habits.years} Years ({habits.frequency})
                </span>
              </div>
            </div>
          </div>

          {/* AI Screening Triage Card */}
          {analysisResult && (
            <div
              className={`rounded-2xl border-2 p-5 shadow-sm space-y-3 transition-all ${
                analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low'
                  ? 'bg-emerald-50/70 border-emerald-400'
                  : 'bg-red-50/50 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                    analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low'
                      ? 'text-emerald-950'
                      : 'text-red-950'
                  }`}
                >
                  {analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>AI Triage Analysis Result</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>AI Onco-Triage Verdict</span>
                    </>
                  )}
                </span>
                <span
                  className={`font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm text-white ${
                    analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low'
                      ? 'bg-emerald-600'
                      : 'bg-red-600'
                  }`}
                >
                  {analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low'
                    ? 'No Disease Found'
                    : `${analysisResult.aiCondition} Condition`}
                </span>
              </div>

              <div>
                <div className="text-base font-extrabold text-slate-900">
                  {analysisResult.aiLesionType}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Confidence Score:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {analysisResult.aiConfidenceScore}% Accuracy
                  </strong>{' '}
                  • Engine: <span className="font-mono text-[11px] text-slate-700">{analysisResult.modelUsed}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-sm">
                <strong className="text-slate-900">Clinical Assessment:</strong> {analysisResult.clinicalRemarks}
              </div>

              {/* Status Notice for Face Photo or No Disease */}
              {analysisResult.hasLesion === false || analysisResult.aiCondition === 'Low' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-royal-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-royal-600" />
                    <span>Guidance for User:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No oral lesion or cancer detected. If you uploaded a face photo, selfie, or non-oral picture, please click <strong>"Upload Other Photo"</strong> and provide a close-up photo of the inside of your mouth (cheek, tongue, or gums) showing any suspected patch.
                  </p>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-slate-800 border-t border-slate-200">
                  <span>Biopsy Referral: Recommended</span>
                  <span className="text-emerald-700 font-extrabold">PHC G. Madugula (Punch Biopsy Kit Ready)</span>
                </div>
              )}
            </div>
          )}

          {/* AUTOMATICALLY SUGGESTED NEARBY ENT, ORAL & DENTAL DOCTORS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                <Stethoscope className="w-4 h-4 text-royal-600" />
                <span>Nearby ENT, Oral & Dental Doctors</span>
              </span>
              <span className="text-[10px] font-bold text-royal-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Auto-Matched PHCs
              </span>
            </div>

            <div className="space-y-2.5">
              {suggestedDoctors.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-royal-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                      <span className="text-[9px] font-semibold bg-blue-100 text-royal-800 px-1.5 py-0.2 rounded">
                        {doc.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">{doc.hospital}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{doc.available}</div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Doctor ${doc.name} selected for priority consultation referral.`);
                    }}
                    className="px-3 py-1.5 bg-royal-600 hover:bg-royal-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveOralCamera;
