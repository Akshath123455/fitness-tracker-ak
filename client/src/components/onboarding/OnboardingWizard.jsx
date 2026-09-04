import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveProfileApi } from '../../services/api';
import { StepDemographics } from './StepDemographics';
import { StepGoals } from './StepGoals';
import { StepEquipmentInjuries } from './StepEquipmentInjuries';
import { StepStrengthBaselines } from './StepStrengthBaselines';
import { StepReviewDisclaimer } from './StepReviewDisclaimer';
import { ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingWizard = ({ onComplete }) => {
  const { refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    demographics: {
      age: 28,
      sex: 'male',
      bodyWeightKg: 80,
      heightCm: 178,
      experienceLevel: 'intermediate',
    },
    goals: {
      primary: 'strength',
      secondary: ['hypertrophy'],
      targetNotes: '',
    },
    schedule: {
      daysPerWeek: 4,
      sessionDurationMin: 60,
      preferredSplit: 'upper_lower',
      periodizationPreference: 'auto',
    },
    equipment: {
      access: 'full_gym',
      availableList: ['barbell', 'dumbbell', 'cable', 'machine'],
    },
    healthFlags: {
      injuries: [],
      specialPopulation: 'general',
      medicalDisclaimerAccepted: false,
      notes: '',
    },
    liftBaselines: {
      squat: { oneRepMax: 120, testedReps: 1, testedWeight: 120, formulaUsed: 'direct_1rm', confidencePct: 95 },
      bench_press: { oneRepMax: 90, testedReps: 1, testedWeight: 90, formulaUsed: 'direct_1rm', confidencePct: 95 },
      deadlift: { oneRepMax: 150, testedReps: 1, testedWeight: 150, formulaUsed: 'direct_1rm', confidencePct: 95 },
      overhead_press: { oneRepMax: 55, testedReps: 1, testedWeight: 55, formulaUsed: 'direct_1rm', confidencePct: 95 },
      pull_up: { oneRepMax: 80, testedReps: 1, testedWeight: 80, formulaUsed: 'direct_1rm', confidencePct: 95 },
      barbell_row: { oneRepMax: 75, testedReps: 1, testedWeight: 75, formulaUsed: 'direct_1rm', confidencePct: 95 },
    },
  });

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const steps = [
    { number: 1, title: 'Demographics' },
    { number: 2, title: 'Goals & Split' },
    { number: 3, title: 'Gear & Safety' },
    { number: 4, title: '1RM Baselines' },
    { number: 5, title: 'Consent & Launch' },
  ];

  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.demographics.age || !formData.demographics.bodyWeightKg) {
        setError('Please provide age and body weight.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(steps.length, prev + 1));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async () => {
    if (!formData.healthFlags.medicalDisclaimerAccepted) {
      setError('Please acknowledge the non-medical consent checkbox.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await saveProfileApi(formData);
      await refreshProfile();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      onComplete();
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err.response?.data?.error || 'Failed to generate training profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  currentStep === s.number
                    ? 'bg-gradient-to-tr from-brand-emerald to-brand-cyan text-dark-950 ring-4 ring-brand-emerald/20 scale-110'
                    : currentStep > s.number
                    ? 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40'
                    : 'bg-dark-850 text-slate-500 border border-dark-700'
                }`}
              >
                {currentStep > s.number ? <Check className="w-4 h-4" /> : s.number}
              </div>
              <span className={`text-[10px] font-semibold mt-1 hidden sm:block ${
                currentStep === s.number ? 'text-white' : 'text-slate-500'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-dark-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-emerald to-brand-cyan transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <StepDemographics formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepGoals formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepEquipmentInjuries formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepStrengthBaselines formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 5 && (
          <StepReviewDisclaimer
            formData={formData}
            updateFormData={updateFormData}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-bold text-xs flex items-center gap-1.5 shadow hover:opacity-95 transition-opacity"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 glow-emerald"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Calibrating Engine...' : 'Generate Training Profile'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
