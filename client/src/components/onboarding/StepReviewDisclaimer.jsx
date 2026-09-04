import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Dumbbell } from 'lucide-react';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const StepReviewDisclaimer = ({ formData, updateFormData, isSubmitting }) => {
  const { unitSystem } = useAuth();
  const [agreed, setAgreed] = useState(formData.healthFlags?.medicalDisclaimerAccepted || false);

  const handleAgreeToggle = (val) => {
    setAgreed(val);
    updateFormData('healthFlags', {
      ...formData.healthFlags,
      medicalDisclaimerAccepted: val,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-emerald" />
          <span>Profile Summary & Medical Consent</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review your intake parameters before our engine generates your periodized program.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-700">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
            Demographics
          </span>
          <p className="text-sm font-bold text-white">
            {formData.demographics.age} yrs • {formData.demographics.sex}
          </p>
          <p className="text-xs text-slate-300">
            {formData.demographics.bodyWeightKg} kg ({Math.round(formData.demographics.bodyWeightKg * 2.20462)} lbs)
          </p>
          <p className="text-[11px] text-brand-emerald font-semibold capitalize mt-1">
            {formData.demographics.experienceLevel} Lifter
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-700">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
            Plan Architecture
          </span>
          <p className="text-sm font-bold text-white capitalize">
            {formData.goals.primary.replace('_', ' ')}
          </p>
          <p className="text-xs text-slate-300">
            {formData.schedule.daysPerWeek} Days/Week • {formData.schedule.sessionDurationMin} min/session
          </p>
          <p className="text-[11px] text-brand-cyan font-semibold capitalize mt-1">
            {formData.schedule.periodizationPreference} Model
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-700">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
            Safety & Environment
          </span>
          <p className="text-sm font-bold text-white capitalize">
            {formData.equipment.access.replace('_', ' ')}
          </p>
          <p className="text-xs text-rose-400 font-medium">
            Injuries: {formData.healthFlags.injuries?.length > 0 ? formData.healthFlags.injuries.join(', ') : 'None'}
          </p>
          <p className="text-[11px] text-slate-400 capitalize mt-1">
            Pop: {formData.healthFlags.specialPopulation}
          </p>
        </div>
      </div>

      {/* Baseline Snapshot */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700">
        <span className="text-xs font-bold text-slate-300 block mb-2">Configured 1RM Baselines</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(formData.liftBaselines || {}).map(([key, val]) => (
            <div key={key} className="p-2 rounded-xl bg-dark-900 border border-dark-750 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                {key.replace('_', ' ')}
              </span>
              <span className="text-xs font-mono font-bold text-brand-emerald">
                {val.oneRepMax || 0} {unitSystem.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="space-y-3">
        <DisclaimerBanner type="medical" />
        <DisclaimerBanner type="strength" />
      </div>

      {/* Consent Checkbox */}
      <div className="p-4 rounded-2xl bg-dark-850/80 border border-brand-emerald/30">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => handleAgreeToggle(e.target.checked)}
            className="w-4 h-4 rounded mt-0.5 accent-brand-emerald bg-dark-900 border-dark-600 focus:ring-0"
          />
          <span className="text-xs text-slate-300 leading-relaxed font-medium">
            I understand that resistance training carries inherent physical risk. I have reviewed the non-medical disclaimer and confirm that my provided biometric metrics are accurate.
          </span>
        </label>
      </div>
    </div>
  );
};
