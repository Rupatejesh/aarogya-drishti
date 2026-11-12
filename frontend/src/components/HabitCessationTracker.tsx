import React, { useState } from 'react';
import {
  Flame,
  Award,
  Sparkles,
  CheckCircle,
  Calendar,
  Smile,
  ShieldCheck,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface HabitCessationTrackerProps {
  patientUidn: string;
  lang: Language;
}

interface Milestone {
  day: number;
  title: string;
  mucosalHealing: string;
  achieved: boolean;
}

export const HabitCessationTracker: React.FC<HabitCessationTrackerProps> = ({
  patientUidn,
  lang
}) => {
  const [streakDays, setStreakDays] = useState(14); // Preloaded at 14 days milestone for evaluation

  const milestones: Milestone[] = [
    {
      day: 3,
      title: 'Day 3: Chemical Clearance',
      mucosalHealing: 'Nicotine metabolites clear from salivary secretions; mucosal micro-circulation begins recovery.',
      achieved: streakDays >= 3
    },
    {
      day: 7,
      title: 'Day 7: Inflammatory Resolution',
      mucosalHealing: 'Mucosal erythema and burning sensation upon spicy intake drop by ~40%.',
      achieved: streakDays >= 7
    },
    {
      day: 14,
      title: 'Day 14: Mucosal Re-Epithelialization',
      mucosalHealing: 'Leukoplakic keratin hyper-proliferation slows; healthy basal cell turnover restored.',
      achieved: streakDays >= 14
    },
    {
      day: 30,
      title: 'Day 30: Dysplasia Arrest',
      mucosalHealing: 'Epithelial micro-vascular network stabilizes; malignant conversion probability decreases substantially.',
      achieved: streakDays >= 30
    },
    {
      day: 60,
      title: 'Day 60: Architectural Remodeling',
      mucosalHealing: 'Submucosal collagen flexibility improves; OSMF vertical banding rigidity relaxes.',
      achieved: streakDays >= 60
    }
  ];

  const handleIncrementStreak = () => {
    const nextDays = streakDays + 1;
    setStreakDays(nextDays);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-royal-700">
              <Flame className="w-5 h-5 text-royal-600" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              Tribal Habit Cessation & Mucosal Healing Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking abstinence from reverse smoking (Adda Poga), raw khaini tobacco, and gutkha.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center space-x-3 bg-blue-50/70 px-4 py-2 rounded-2xl border border-blue-200">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500">Tobacco-Free Streak</div>
            <div className="text-2xl font-black text-royal-950">
              {streakDays} <span className="text-xs font-semibold text-emerald-700">Days Clean</span>
            </div>
          </div>
          <button
            onClick={handleIncrementStreak}
            className="px-3.5 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+1 Day Streak</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Goal: 30-Day Mucosal Healing Milestone</span>
          <span className="font-bold text-royal-800">{Math.min(100, Math.round((streakDays / 30) * 100))}% Completed</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-royal-600 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (streakDays / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* Clinical Milestones Roadmap */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Biological Healing Milestones
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((m) => (
            <div
              key={m.day}
              className={`p-3.5 rounded-2xl border transition-all ${
                m.achieved
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs flex items-center space-x-1.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${m.achieved ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{m.title}</span>
                </span>
                {m.achieved && (
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Achieved
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">
                {m.mucosalHealing}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitCessationTracker;
