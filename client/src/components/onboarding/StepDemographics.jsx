import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Scale, Ruler, Sparkles } from 'lucide-react';

export const StepDemographics = ({ formData, updateFormData }) => {
  const { unitSystem } = useAuth();

  const experienceLevels = [
    { id: 'beginner', title: 'Beginner (< 1 Year)', desc: 'Learning fundamental movement patterns and motor control' },
    { id: 'intermediate', title: 'Intermediate (1 - 3 Years)', desc: 'Consistent progression, familiar with compound barbell/dumbbell mechanics' },
    { id: 'advanced', title: 'Advanced (3 - 6 Years)', desc: 'Requires periodization waves to overcome adaptive resistance' },
    { id: 'elite', title: 'Elite (6+ Years)', desc: 'Near genetic ceiling, highly targeted micro-progression' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-brand-emerald" />
          <span>Demographics & Anthropometrics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Your strength standards and recovery curve are calibrated against your exact demographic cohort.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Age */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Age (Years) <span className="text-brand-emerald">*</span>
          </label>
          <input
            type="number"
            min={13}
            max={99}
            value={formData.demographics.age || ''}
            onChange={(e) =>
              updateFormData('demographics', {
                ...formData.demographics,
                age: parseInt(e.target.value) || 0,
              })
            }
            placeholder="e.g. 28"
            className="w-full px-4 py-3 bg-dark-850 border border-dark-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-brand-emerald"
          />
          {formData.demographics.age > 0 && formData.demographics.age < 18 && (
            <p className="text-[11px] text-amber-400 mt-1">Teen cohort: Load progressions include joint-sparing volume guardrails.</p>
          )}
        </div>

        {/* Biological Sex */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Biological Sex for Strength Norms <span className="text-brand-emerald">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'male', label: 'Male' },
              { id: 'female', label: 'Female' },
              { id: 'prefer_not_to_say', label: 'Unisex' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  updateFormData('demographics', {
                    ...formData.demographics,
                    sex: option.id,
                  })
                }
                className={`py-3 rounded-xl text-xs font-bold transition-all ${
                  formData.demographics.sex === option.id
                    ? 'bg-gradient-to-r from-brand-emerald/20 to-brand-cyan/20 text-brand-emerald border border-brand-emerald/50'
                    : 'bg-dark-850 text-slate-400 border border-dark-700 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Weight */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Body Weight ({unitSystem.toUpperCase()}) <span className="text-brand-emerald">*</span>
          </label>
          <div className="relative">
            <Scale className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="0.5"
              value={
                unitSystem === 'lbs'
                  ? Math.round((formData.demographics.bodyWeightKg * 2.20462 || 0) * 10) / 10 || ''
                  : formData.demographics.bodyWeightKg || ''
              }
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                const kgVal = unitSystem === 'lbs' ? val / 2.20462 : val;
                updateFormData('demographics', {
                  ...formData.demographics,
                  bodyWeightKg: Math.round(kgVal * 10) / 10,
                });
              }}
              placeholder={unitSystem === 'lbs' ? '180' : '82.5'}
              className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-dark-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-brand-emerald"
            />
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Height (cm) <span className="text-brand-emerald">*</span>
          </label>
          <div className="relative">
            <Ruler className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              value={formData.demographics.heightCm || ''}
              onChange={(e) =>
                updateFormData('demographics', {
                  ...formData.demographics,
                  heightCm: parseInt(e.target.value) || 0,
                })
              }
              placeholder="180"
              className="w-full pl-10 pr-4 py-3 bg-dark-850 border border-dark-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-brand-emerald"
            />
          </div>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Training Experience Level <span className="text-brand-emerald">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {experienceLevels.map((lvl) => {
            const isSelected = formData.demographics.experienceLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() =>
                  updateFormData('demographics', {
                    ...formData.demographics,
                    experienceLevel: lvl.id,
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
                    {lvl.title}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{lvl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
