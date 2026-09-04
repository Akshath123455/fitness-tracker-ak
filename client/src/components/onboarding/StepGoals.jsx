import React from 'react';
import { Target, Calendar, Clock, Layers, Sparkles } from 'lucide-react';

export const StepGoals = ({ formData, updateFormData }) => {
  const goalsList = [
    { id: 'strength', title: 'Maximal Strength', desc: 'Prioritize compound 1RM strength and neuromuscular force output' },
    { id: 'hypertrophy', title: 'Muscle Hypertrophy', desc: 'Maximize myofibrillar cross-sectional area and metabolic volume' },
    { id: 'fat_loss', title: 'Body Recomposition & Fat Loss', desc: 'Retain lean mass while burning calories through high density' },
    { id: 'general_fitness', title: 'General Longevity & Health', desc: 'Balanced cardiovascular, functional mobility, and strength foundation' },
    { id: 'sport_specific', title: 'Athletic Performance', desc: 'Rate of force development (RFD), speed-strength, and power' },
    { id: 'rehab', title: 'Return-to-Training / Rehab', desc: 'Conservative joint loading and stabilizer reinforcement' },
  ];

  const periodizationModels = [
    { id: 'auto', title: 'Auto AI Adaptive', desc: 'Engine chooses optimal model based on your experience' },
    { id: 'linear', title: 'Linear Progression', desc: 'Consistent weekly load increments (+1.25 - 2.5kg)' },
    { id: 'undulating', title: 'Daily Undulating (DUP)', desc: 'Alternates Hypertrophy, Power, and Strength stimuli across the week' },
    { id: 'block', title: 'Block Periodization', desc: 'Accumulation -> Transmutation -> Realization peaking waves' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-emerald" />
          <span>Training Goals & Schedule</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tell us your primary adaptation vector and weekly time budget.
        </p>
      </div>

      {/* Primary Goal */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Primary Objective <span className="text-brand-emerald">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goalsList.map((g) => {
            const isSelected = formData.goals.primary === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  updateFormData('goals', {
                    ...formData.goals,
                    primary: g.id,
                  })
                }
                className={`p-3.5 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-brand-emerald/10 border-brand-emerald text-white'
                    : 'bg-dark-850 border-dark-700/80 text-slate-300 hover:border-dark-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-emerald' : 'text-slate-200'}`}>
                    {g.title}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{g.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule: Days per week & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Days per week */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              <span>Days Per Week</span>
            </span>
            <span className="text-xs font-bold text-brand-cyan">{formData.schedule.daysPerWeek} Days</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() =>
                  updateFormData('schedule', {
                    ...formData.schedule,
                    daysPerWeek: days,
                  })
                }
                className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  formData.schedule.daysPerWeek === days
                    ? 'bg-brand-cyan text-dark-950 shadow-md'
                    : 'bg-dark-850 text-slate-400 border border-dark-700 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {/* Session Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-cyan" />
              <span>Session Length</span>
            </span>
            <span className="text-xs font-bold text-brand-cyan">{formData.schedule.sessionDurationMin} Min</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[30, 45, 60, 75].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() =>
                  updateFormData('schedule', {
                    ...formData.schedule,
                    sessionDurationMin: mins,
                  })
                }
                className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  formData.schedule.sessionDurationMin === mins
                    ? 'bg-brand-cyan text-dark-950 shadow-md'
                    : 'bg-dark-850 text-slate-400 border border-dark-700 hover:text-white'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Periodization Architecture */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-brand-violet" />
          <span>Periodization Architecture</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {periodizationModels.map((p) => {
            const isSelected = formData.schedule.periodizationPreference === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  updateFormData('schedule', {
                    ...formData.schedule,
                    periodizationPreference: p.id,
                  })
                }
                className={`p-3 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-brand-violet/15 border-brand-violet text-white'
                    : 'bg-dark-850 border-dark-700/80 text-slate-300 hover:border-dark-600'
                }`}
              >
                <p className={`text-xs font-bold ${isSelected ? 'text-brand-violet' : 'text-slate-200'}`}>{p.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
