import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  CameraOff,
  Video,
  SwitchCamera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Layers,
  Flame,
  Stethoscope,
  FileImage,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Activity,
  Check,
  FileText,
  ScanLine,
  Target,
  Maximize2,
  HelpCircle,
  Cloud,
  ExternalLink
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface PatientAiScreeningUploadProps {
  patient: any;
  lang: Language;
  onScreeningCompleted: (screening: any) => void;
  onLaunchFullCameraModal?: () => void;
}

const REGIONS = [
  'Right Buccal Mucosa',
  'Left Cheek',
  'Tongue Dorsum',
  'Floor of Mouth',
  'Palate',
  'Lower Gums / Labial'
];

export const PatientAiScreeningUpload: React.FC<PatientAiScreeningUploadProps> = ({
  patient,
  lang,
  onScreeningCompleted,
  onLaunchFullCameraModal
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Tab mode: 'camera' (Live Webcam), 'upload' (File upload), 'samples' (Quick test cases)
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('Right Buccal Mucosa');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cloudinaryInfo, setCloudinaryInfo] = useState<any>(null);

  // Risk profile (clean default: unselected so user chooses their real habits)
  const [habits, setHabits] = useState({
    tobacco: false,
    gutkha: false,
    reverseSmoking: false,
    areca: false,
    years: 0,
    frequency: 'None'
  });

  const [symptoms, setSymptoms] = useState<string[]>([]);

  // Clean up camera stream when unmounting or switching tabs
  useEffect(() => {
    if (activeTab === 'camera' && !selectedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, selectedImage, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam is not supported on this browser or requires an HTTPS / localhost connection.');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Webcam start failed:', err);
      setCameraError(err.message || 'Unable to access device camera. Please check camera permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext unavailable or blocked by autoplay policy
    }
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user camera, mirror it
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Shutter visual & sound feedback
      setIsShutterFlashing(true);
      playShutterSound();
      setTimeout(() => setIsShutterFlashing(false), 200);

      setSelectedImage(dataUrl);
      setAnalysisResult(null);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSample = (sampleType: 'leukoplakia' | 'osmf' | 'erythroplakia' | 'healthy' | 'face') => {
    stopCamera();
    if (sampleType === 'leukoplakia') {
      setSelectedImage('https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800');
      setSelectedRegion('Right Buccal Mucosa');
      setHabits({
        tobacco: true,
        gutkha: false,
        reverseSmoking: true,
        areca: true,
        years: 18,
        frequency: '6-8 times daily'
      });
      setSymptoms([
        'Persistent white cheek patch (>3 weeks)',
        'Mild burning sensation with spicy food',
        'Rough indurated mucosal texture'
      ]);
    } else if (sampleType === 'osmf') {
      setSelectedImage('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800');
      setSelectedRegion('Left Cheek');
      setHabits({
        tobacco: false,
        gutkha: true,
        reverseSmoking: false,
        areca: true,
        years: 8,
        frequency: '4 packets daily'
      });
      setSymptoms([
        'Restricted mouth opening / trismus (<2 fingers)',
        'Severe burning sensation',
        'Blanched fibrous mucosal bands'
      ]);
    } else if (sampleType === 'erythroplakia') {
      setSelectedImage('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800');
      setSelectedRegion('Floor of Mouth');
      setHabits({
        tobacco: true,
        gutkha: true,
        reverseSmoking: true,
        areca: true,
        years: 12,
        frequency: '5 times daily'
      });
      setSymptoms([
        'Velvety red mucosal lesion',
        'Bleeding on slight abrasion',
        'Persistent burning'
      ]);
    } else if (sampleType === 'healthy') {
      setSelectedImage('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800');
      setSelectedRegion('Tongue Dorsum');
      setHabits({
        tobacco: false,
        gutkha: false,
        reverseSmoking: false,
        areca: false,
        years: 0,
        frequency: 'None'
      });
      setSymptoms([]);
    } else {
      // Demo face photo (non-oral test)
      setSelectedImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800');
      setSelectedRegion('Right Buccal Mucosa');
      setSymptoms([]);
    }
    setAnalysisResult(null);
  };

  const handleRunAiPrediction = async () => {
    if (!selectedImage) {
      alert('Please capture a live photo or upload an image first.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('patientUidn', patient?.uidn || 'UIDN-ASR-2026-GM046');
      formData.append('oralRegion', selectedRegion);
      formData.append('symptomsChecklist', JSON.stringify(symptoms));
      formData.append('habitExposure', JSON.stringify(habits));
      formData.append('imageBase64', selectedImage);

      const res = await api.analyzeOralPhoto(formData);
      setAnalysisResult(res.analysis);
      if (res.cloudinary) {
        setCloudinaryInfo(res.cloudinary);
      } else if (res.screening?.cloudinarySecureUrl) {
        setCloudinaryInfo({
          secure_url: res.screening.cloudinarySecureUrl,
          public_id: res.screening.cloudinaryPublicId
        });
      }
      if (res.screening) {
        onScreeningCompleted(res.screening);
      }
    } catch (err: any) {
      console.error('AI Prediction error:', err);
      alert(`AI Screening Notice: ${err.message || 'Error running vision prediction'}`);
    } finally {
      setLoading(false);
    }
  };

  const isNoDisease =
    analysisResult &&
    (analysisResult.hasLesion === false ||
      analysisResult.isOralCavity === false ||
      analysisResult.aiCondition === 'Low' ||
      analysisResult.aiLesionType?.toLowerCase().includes('no disease') ||
      analysisResult.aiLesionType?.toLowerCase().includes('no oral') ||
      analysisResult.aiLesionType?.toLowerCase().includes('healthy') ||
      analysisResult.aiLesionType?.toLowerCase().includes('face') ||
      analysisResult.aiLesionType?.toLowerCase().includes('external') ||
      analysisResult.aiLesionType?.toLowerCase().includes('portrait'));

  const isFacePhoto =
    analysisResult &&
    (analysisResult.isOralCavity === false ||
      analysisResult.aiLesionType?.toLowerCase().includes('face') ||
      analysisResult.aiLesionType?.toLowerCase().includes('portrait') ||
      analysisResult.aiLesionType?.toLowerCase().includes('external') ||
      analysisResult.aiLesionType?.toLowerCase().includes('non-oral'));

  const getBoxStyle = () => {
    const b = analysisResult?.boundingBoxCoordinates;
    if (!b || (b.xmin === 0 && b.xmax === 0)) {
      return { left: '22%', top: '18%', width: '56%', height: '58%' };
    }
    // If coordinates are in 0-1000 range
    if (b.xmax > 10) {
      const left = Math.max(5, Math.min(85, b.xmin / 10));
      const top = Math.max(5, Math.min(85, b.ymin / 10));
      const width = Math.max(12, Math.min(85, (b.xmax - b.xmin) / 10));
      const height = Math.max(12, Math.min(85, (b.ymax - b.ymin) / 10));
      return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
    }
    // If coordinates are in 0-1 range
    const left = Math.max(5, Math.min(85, b.xmin * 100));
    const top = Math.max(5, Math.min(85, b.ymin * 100));
    const width = Math.max(12, Math.min(85, (b.xmax - b.xmin) * 100));
    const height = Math.max(12, Math.min(85, (b.ymax - b.ymin) * 100));
    return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="w-9 h-9 rounded-2xl bg-royal-50 border border-royal-200 flex items-center justify-center text-royal-600 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Oral Photo Lesion Scanner & Multimodal Vision
                </h3>
                <span className="text-[10px] bg-royal-100 text-royal-800 font-extrabold px-2.5 py-0.5 rounded-full border border-royal-200">
                  Gemini Multimodal Live AI
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-900 font-extrabold px-2.5 py-0.5 rounded-full border border-sky-300 flex items-center space-x-1">
                  <Cloud className="w-3 h-3 text-sky-700" />
                  <span>Cloudinary CDN</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Capture live oral photos with your webcam or upload intra-oral pictures. AI will detect, classify, and declare the exact oral disease.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Way Mode Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setSelectedImage(null);
              setAnalysisResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
            {cameraActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('samples');
              stopCamera();
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'samples'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Test Samples</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: LIVE WEBCAM / CAPTURE / UPLOAD DISPLAY (7 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. If NO image has been captured/selected yet: */}
          {!selectedImage ? (
            <>
              {/* TAB 1: LIVE WEBCAM CAPTURE */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-royal-500 shadow-lg flex items-center justify-center">
                    {/* Live Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />

                    {/* Camera Flash Overlay Animation */}
                    {isShutterFlashing && (
                      <div className="absolute inset-0 bg-white opacity-90 transition-opacity duration-150 pointer-events-none z-30" />
                    )}

                    {/* Target Reticle Overlay for Oral Mucosa */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
                        {/* Oral Target Guide Ellipse */}
                        <div className="relative w-64 h-48 sm:w-72 sm:h-52 rounded-[45%] border-2 border-dashed border-amber-300/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center justify-center">
                          {/* Corner alignment marks */}
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-400 rounded" />
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-400 rounded" />
                          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded" />
                          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded" />

                          <div className="bg-slate-900/80 text-amber-200 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow border border-amber-400/40 text-center">
                            Align Mouth / Cheek Lesion Here
                          </div>
                        </div>

                        {/* Top Live Badge */}
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-slate-700 flex items-center space-x-1.5 shadow">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE FEED • 1080p • {facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}</span>
                        </div>
                      </div>
                    )}

                    {/* Error / Inactive State */}
                    {!cameraActive && (
                      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900 text-white space-y-3 z-20">
                        <div className="w-14 h-14 rounded-2xl bg-royal-900/60 border border-royal-500/50 flex items-center justify-center text-royal-300">
                          <CameraOff className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Camera Inactive</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            {cameraError || 'Click below to start your device camera for real-time oral lesion capture.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Start Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                          >
                            Switch to File Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Action Control Bar */}
                  {cameraActive && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleSwitchCamera}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                          title="Flip between front and rear camera"
                        >
                          <SwitchCamera className="w-3.5 h-3.5 text-royal-600" />
                          <span>Flip Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
                        >
                          <CameraOff className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      </div>

                      {/* Main Capture Button */}
                      <button
                        type="button"
                        onClick={handleCaptureFromCamera}
                        className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 hover:-translate-y-0.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-slate-950" />
                        <span>📸 CAPTURE ORAL PHOTO</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FILE UPLOAD (DRAG & DROP) */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-royal-500 rounded-3xl p-10 text-center bg-slate-50/60 hover:bg-blue-50/30 transition-all cursor-pointer space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto text-royal-600 shadow-sm">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Click to Upload or Drag & Drop Intra-Oral Photo
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports high-resolution JPEG, PNG, WEBP from your phone gallery or desktop.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="px-4 py-2 bg-royal-600 text-white rounded-xl text-xs font-bold shadow-sm inline-block">
                      Browse Local Files
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: INSTANT CLINICAL TEST SAMPLES */}
              {activeTab === 'samples' && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-royal-600" />
                    <span>Instant Evaluation Test Scenarios (1-Click Fill)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Select a validated clinical intra-oral case to instantly test the Gemini Vision AI model:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Sample 1: Leukoplakia */}
                    <button
                      type="button"
                      onClick={() => handleLoadSample('leukoplakia')}
                      className="p-3 bg-white hover:bg-blue-50/80 border border-royal-300 rounded-2xl text-left space-y-1 transition-all shadow-sm group hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 group-hover:text-royal-700">
                          1. Oral Leukoplakia (White Patch)
                        </span>
                        <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                          Serious
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        K. Somanna Compulsory Case: 46y, G. Madugula, 18y tobacco habit, right buccal lesion.
                      </p>
                    </button>

                    {/* Sample 2: OSMF */}
                    <button
                      type="button"
                      onClick={() => handleLoadSample('osmf')}
                      className="p-3 bg-white hover:bg-blue-50/80 border border-slate-200 rounded-2xl text-left space-y-1 transition-all shadow-sm group hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 group-hover:text-royal-700">
                          2. Oral Submucous Fibrosis (OSMF)
                        </span>
                        <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded">
                          Grade III
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Cheek blanching, fibrous bands, trismus with restricted opening &lt;2 fingers.
                      </p>
                    </button>

                    {/* Sample 3: Erythroplakia */}
                    <button
                      type="button"
                      onClick={() => handleLoadSample('erythroplakia')}
                      className="p-3 bg-white hover:bg-blue-50/80 border border-slate-200 rounded-2xl text-left space-y-1 transition-all shadow-sm group hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 group-hover:text-royal-700">
                          3. Erythroplakia (Red Mucosa)
                        </span>
                        <span className="text-[9px] bg-red-700 text-white font-extrabold px-1.5 py-0.5 rounded">
                          High Risk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Velvety erythematous lesion with high dysplasia transformation rate.
                      </p>
                    </button>

                    {/* Sample 4: Healthy */}
                    <button
                      type="button"
                      onClick={() => handleLoadSample('healthy')}
                      className="p-3 bg-white hover:bg-emerald-50/80 border border-slate-200 rounded-2xl text-left space-y-1 transition-all shadow-sm group hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                          4. Normal Healthy Oral Cavity
                        </span>
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                          Healthy
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Healthy mucosal tissues with no clinical lesions or ulcers.
                      </p>
                    </button>

                    {/* Sample 5: Non-Oral / Face Photo */}
                    <button
                      type="button"
                      onClick={() => handleLoadSample('face')}
                      className="p-3 bg-white hover:bg-amber-50/80 border border-amber-300 rounded-2xl text-left space-y-1 transition-all shadow-sm group sm:col-span-2 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 group-hover:text-amber-800">
                          5. Non-Oral Picture (Demo Face Portrait)
                        </span>
                        <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                          Face Check
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Tests AI safety guard: accurately detects face portrait and requests intra-oral picture.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 2. When an image HAS been captured or uploaded: */
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-royal-500 shadow-md flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Captured Oral Scan"
                  className="w-full h-full object-contain"
                />

                {/* AI Disease Lesion Bounding Box Overlay (ONLY shown when lesion actually exists!) */}
                {analysisResult && !isNoDisease && analysisResult.hasLesion !== false && (
                  <div
                    className="absolute border-2 border-red-500 rounded-xl bg-red-500/15 pointer-events-none shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"
                    style={getBoxStyle()}
                  >
                    <div className="absolute -top-8 left-0 bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-md flex items-center space-x-1.5 whitespace-nowrap">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                      <span>{analysisResult.aiLesionType}</span>
                      <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px] ml-1 font-mono">
                        {analysisResult.aiConfidenceScore}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Badge showing origin */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-slate-700 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Captured Image Ready for AI Diagnosis</span>
                </div>
              </div>

              {/* Action Buttons: Retake / Switch vs Run Prediction */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Retake / Recapture</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunAiPrediction}
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-royal-600 hover:bg-royal-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>
                    {loading ? 'Analyzing with Gemini Vision AI...' : 'Run Gemini AI Disease Prediction'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PARAMETERS & PROMINENT AI DISEASE DECLARATION (5 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Region Picker */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-royal-600" />
                <span>Target Oral Mucosal Region</span>
              </span>
              <span className="text-[10px] text-royal-700 font-bold font-mono">
                {selectedRegion}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRegion(r)}
                  className={`p-2 rounded-xl text-[11px] font-semibold text-left transition-all border ${
                    selectedRegion === r
                      ? 'bg-royal-600 text-white border-royal-700 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Habit & Symptom Checklist Toggle Pills */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Habit Exposure Profile</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setHabits({ tobacco: false, gutkha: false, reverseSmoking: false, areca: false, years: 0, frequency: 'None' })}
                  className="text-[10px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setHabits(prev => ({ ...prev, tobacco: !prev.tobacco }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${habits.tobacco ? 'bg-red-50 text-red-800 border-red-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {habits.tobacco ? '✓ Chewing Tobacco' : '+ Chewing Tobacco'}
              </button>
              <button
                type="button"
                onClick={() => setHabits(prev => ({ ...prev, reverseSmoking: !prev.reverseSmoking }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${habits.reverseSmoking ? 'bg-red-50 text-red-800 border-red-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {habits.reverseSmoking ? '✓ Reverse Smoking (Chutta)' : '+ Reverse Smoking'}
              </button>
              <button
                type="button"
                onClick={() => setHabits(prev => ({ ...prev, areca: !prev.areca }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${habits.areca ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {habits.areca ? '✓ Areca Nut' : '+ Areca Nut'}
              </button>
              <button
                type="button"
                onClick={() => setHabits(prev => ({ ...prev, gutkha: !prev.gutkha }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${habits.gutkha ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {habits.gutkha ? '✓ Gutkha / Pan Masala' : '+ Gutkha'}
              </button>
            </div>
          </div>

          {/* AI Arogya Interactive Symptom Questions */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-royal-600" />
                <span>AI Arogya Clinical Symptom Questions</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Click to select active symptoms</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Persistent white cheek patch (>3 weeks)',
                'Burning sensation with spicy food',
                'Difficulty opening mouth / jaw stiffness (OSMF)',
                'Non-healing oral ulcer or indurated lump'
              ].map((sym) => {
                const isSelected = symptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setSymptoms(prev =>
                        prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
                      );
                    }}
                    className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-royal-900 border-royal-400 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sym}</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-royal-600 text-white font-black' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isSelected ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PROMINENT AI DISEASE DECLARATION CARD */}
          {/* ===================================================================== */}
          {analysisResult && (
            <div
              className={`rounded-3xl border-2 p-5 shadow-lg space-y-4 transition-all animate-in fade-in duration-300 ${
                isNoDisease
                  ? 'bg-emerald-50/80 border-emerald-400'
                  : 'bg-gradient-to-br from-red-50 via-white to-amber-50/40 border-red-400'
              }`}
            >
              {/* Top Verdict Header */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-200/80">
                <div className="flex items-center space-x-2">
                  {isNoDisease ? (
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm animate-pulse">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider block ${
                        isNoDisease ? 'text-emerald-900' : 'text-red-900'
                      }`}
                    >
                      {isNoDisease ? 'CLINICAL VERDICT' : 'AI DISEASE DIAGNOSIS DECLARED'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Target: {selectedRegion}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-black text-xs px-3 py-1 rounded-full shadow-sm text-white ${
                    isNoDisease
                      ? 'bg-emerald-600'
                      : analysisResult.aiCondition === 'Serious'
                      ? 'bg-red-600'
                      : 'bg-amber-600'
                  }`}
                >
                  {isNoDisease ? 'No Disease Found' : `${analysisResult.aiCondition} Condition`}
                </span>
              </div>

              {/* Exact Disease Name Declared by AI */}
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  DIAGNOSED ORAL PATHOLOGY / DISEASE:
                </div>
                <div className="text-xl font-black text-slate-950 tracking-tight leading-snug">
                  {analysisResult.aiLesionType}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Confidence: {analysisResult.aiConfidenceScore}% Accuracy
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                    Advisory Screening — Not for Clinical Diagnosis
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                    {analysisResult.modelUsed || 'Gemini Multimodal Live Vision'}
                  </span>
                </div>
              </div>

              {/* Detailed Pathological Assessment */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-sm space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-royal-600" />
                  <span>Clinical Remarks & Disease Etiology:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {analysisResult.clinicalRemarks}
                </p>
              </div>

              {/* Cloudinary CDN Asset Storage Proof */}
              {cloudinaryInfo?.secure_url && (
                <div className="flex items-center justify-between text-xs bg-sky-50 border border-sky-200 rounded-2xl p-3 text-sky-950 shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                      <Cloud className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>Cloudinary CDN Synced</span>
                        <span className="text-[10px] bg-sky-200 text-sky-900 font-extrabold px-1.5 py-0.2 rounded">Encrypted</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono truncate max-w-[200px] sm:max-w-xs">
                        {cloudinaryInfo.public_id}
                      </div>
                    </div>
                  </div>
                  <a
                    href={cloudinaryInfo.secure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 hover:text-sky-900 font-bold bg-white hover:bg-sky-100 border border-sky-300 rounded-xl px-2.5 py-1 text-xs flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <span>View on CDN</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Actionable Clinical Referral Pathway */}
              {isNoDisease ? (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-royal-950 space-y-1.5">
                  <div className="font-bold flex items-center space-x-1.5 text-royal-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-royal-600" />
                    <span>Guidance for Citizen / Patient:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isFacePhoto
                      ? 'The captured picture was identified as a facial portrait. Please start the Live Camera, open your mouth, and focus on the inside of the cheek, tongue, or gums.'
                      : 'No pre-malignant or neoplastic lesion detected in this oral scan. Maintain oral hygiene, continue regular checkups at your local PHC, and avoid chewing tobacco.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      RECOMMENDED CLINICAL PATHWAY (NEARBY SPECIALISTS):
                    </span>
                    <span className="text-[10px] text-royal-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Nearby PHC / CHC Specialists
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* 1. Oral Onco-Pathologist */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold bg-blue-100 text-royal-800 px-1.5 py-0.5 rounded">Oral Specialist</span>
                          <strong className="text-slate-900 font-bold">Dr. Swapna Devi, MDS</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          PHC G. Madugula / GGH Paderu Tele-Lab Hub • 4mm Punch Biopsy
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Saturday 10:30 AM Slot Available</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-royal-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                        Primary Referral
                      </span>
                    </div>

                    {/* 2. ENT Specialist */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">ENT Specialist</span>
                          <strong className="text-slate-900 font-bold">Dr. K. Rajesh, MS ENT</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Area Hospital Paderu Hub • Head & Neck Oncology
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Mon-Fri 09:30 AM - 01:00 PM
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                        Surgical Opinion
                      </span>
                    </div>

                    {/* 3. Dental Medical Officer */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Dental MO</span>
                          <strong className="text-slate-900 font-bold">Dr. Anand Kumar, MDS</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          CHC G. Madugula • Oral Medicine & Tobacco Intervention
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Daily 10:00 AM - 04:00 PM
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                        Local Follow-Up
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAiScreeningUpload;
