import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Layers,
  Flame,
  Stethoscope,
  FileImage,
  ArrowRight
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface PatientAiScreeningUploadProps {
  patient: any;
  lang: Language;
  onScreeningCompleted: (screening: any) => void;
  onLaunchFullCameraModal: () => void;
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

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('Right Buccal Mucosa');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSample = (type: 'leukoplakia' | 'face') => {
    if (type === 'leukoplakia') {
      setSelectedImage('https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800');
    } else {
      setSelectedImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800');
    }
    setAnalysisResult(null);
  };

  const handleRunAiPrediction = async () => {
    if (!selectedImage) {
      alert('Please upload an image first.');
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
      if (res.screening) {
        onScreeningCompleted(res.screening);
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Screening Notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isNoDisease =
    analysisResult &&
    (analysisResult.hasLesion === false ||
      analysisResult.aiCondition === 'Low' ||
      analysisResult.aiLesionType?.toLowerCase().includes('no disease') ||
      analysisResult.aiLesionType?.toLowerCase().includes('face'));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Section Title & Description */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-royal-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-slate-900">
              AI Oral Photo Lesion Scanner & Multimodal Vision
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload an intra-oral picture of your mouth, cheek, or tongue for real-time Gemini AI onco-triage analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onLaunchFullCameraModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-royal-700 border border-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Camera className="w-4 h-4 text-royal-600" />
            <span>Launch Live Webcam</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Upload Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-royal-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-blue-50/30 transition-all cursor-pointer space-y-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-100/70 border border-blue-200 flex items-center justify-center mx-auto text-royal-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Click to Upload or Drag & Drop Intra-Oral Photo
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WEBP from your phone or computer.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Browse Image Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample('leukoplakia');
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-all"
                >
                  Load Leukoplakia Sample
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample('face');
                  }}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-all"
                >
                  Test Demo Face Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 shadow-sm flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Selected Oral Scan"
                  className="w-full h-full object-contain"
                />

                {/* Bounding box when lesion is detected */}
                {analysisResult && !isNoDisease && (
                  <div
                    className="absolute border-2 border-red-500 rounded-lg bg-red-500/10 pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.5)]"
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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Other Photo</span>
                </button>

                <button
                  onClick={handleRunAiPrediction}
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-royal-600 hover:bg-royal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{loading ? 'Analyzing with Gemini Vision AI...' : 'Run Gemini AI Vision Prediction'}</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Right Column: Parameters & Real-Time Verdict (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Region Picker */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-royal-600" />
              <span>Target Oral Mucosal Region</span>
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

          {/* AI Screening Result Card */}
          {analysisResult && (
            <div
              className={`rounded-2xl border-2 p-5 shadow-sm space-y-3 transition-all ${
                isNoDisease ? 'bg-emerald-50/70 border-emerald-400' : 'bg-red-50/50 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                    isNoDisease ? 'text-emerald-950' : 'text-red-950'
                  }`}
                >
                  {isNoDisease ? (
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
                    isNoDisease ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                >
                  {isNoDisease ? 'No Disease Found' : `${analysisResult.aiCondition} Condition`}
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
              {isNoDisease ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-royal-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-royal-600" />
                    <span>Guidance for User:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No oral cancer or leukoplakia lesion detected. If you uploaded a demo face photo, selfie, or non-oral picture, please click <strong>"Upload Other Photo"</strong> and provide a close-up photo of the inside of your mouth (cheek, tongue, or gums) showing any suspected patch.
                  </p>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-slate-800 border-t border-slate-200">
                  <span>Biopsy Referral: Recommended</span>
                  <span className="text-emerald-700 font-extrabold">PHC G. Madugula (Punch Kit Ready)</span>
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
