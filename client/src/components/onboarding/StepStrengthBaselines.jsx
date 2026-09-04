import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calculator, Award, ArrowRight, HelpCircle } from 'lucide-react';

export const StepStrengthBaselines = ({ formData, updateFormData }) => {
  const { unitSystem, formatWeight } = useAuth();
  const [activeTab, setActiveTab] = useState('squat');
  const [guidedModal, setGuidedModal] = useState(null); // liftKey

  const lifts = [
    { key: 'squat', name: 'Barbell Back Squat', default1RM: 100, pattern: 'Squat / Lower Quad' },
    { key: 'bench_press', name: 'Barbell Bench Press', default1RM: 80, pattern: 'Horizontal Push / Chest' },
    { key: 'deadlift', name: 'Conventional Deadlift', default1RM: 130, pattern: 'Hinge / Posterior Chain' },
    { key: 'overhead_press', name: 'Standing Overhead Press', default1RM: 50, pattern: 'Vertical Push / Shoulders' },
    { key: 'pull_up', name: 'Pull-Up (Total Load)', default1RM: 85, pattern: 'Vertical Pull / Lats' },
    { key: 'barbell_row', name: 'Bent-Over Barbell Row', default1RM: 70, pattern: 'Horizontal Pull / Upper Back' },
  ];

  const updateLift1RM = (liftKey, value) => {
    const num = parseFloat(value) || 0;
    const currentBaselines = formData.liftBaselines || {};
    updateFormData('liftBaselines', {
      ...currentBaselines,
      [liftKey]: {
        ...(currentBaselines[liftKey] || {}),
        oneRepMax: Math.round(num * 10) / 10,
        testedWeight: Math.round(num * 10) / 10,
        testedReps: 1,
        formulaUsed: 'direct_1rm',
        confidencePct: 95,
      },
    });
  };

  const applyGuidedEstimate = (liftKey, weight, reps) => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 1;
    // Epley Formula: W * (1 + R/30)
    const e1rm = r === 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10;

    const currentBaselines = formData.liftBaselines || {};
    updateFormData('liftBaselines', {
      ...currentBaselines,
      [liftKey]: {
        oneRepMax: e1rm,
        testedWeight: w,
        testedReps: r,
        formulaUsed: 'epley_guided',
        confidencePct: r <= 5 ? 95 : 85,
        lastUpdated: new Date(),
      },
    });

    setGuidedModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-emerald" />
          <span>Strength Baselines & 1RM Calibration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your tested or estimated 1-Rep Maxes. Beginners can use our guided rep-calculator.
        </p>
      </div>

      {/* Lift Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lifts.map((lift) => {
          const current1RM = formData.liftBaselines?.[lift.key]?.oneRepMax || 0;
          return (
            <div
              key={lift.key}
              className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 hover:border-dark-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{lift.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{lift.pattern}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">Estimated 1-Rep Max ({unitSystem.toUpperCase()})</p>

                <div className="relative mb-3">
                  <input
                    type="number"
                    step="0.5"
                    value={current1RM > 0 ? current1RM : ''}
                    onChange={(e) => updateLift1RM(lift.key, e.target.value)}
                    placeholder={`e.g. ${lift.default1RM}`}
                    className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-sm font-mono font-bold text-brand-emerald focus:outline-none focus:border-brand-emerald"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 font-bold">
                    {unitSystem.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Guided Calculator Trigger */}
              <button
                type="button"
                onClick={() => setGuidedModal(lift.key)}
                className="w-full py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-dark-600/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Estimate from Reps</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Guided Estimation Modal */}
      {guidedModal && (
        <GuidedEstimatorModal
          liftKey={guidedModal}
          liftName={lifts.find((l) => l.key === guidedModal)?.name || ''}
          unitSystem={unitSystem}
          onClose={() => setGuidedModal(null)}
          onApply={(weight, reps) => applyGuidedEstimate(guidedModal, weight, reps)}
        />
      )}
    </div>
  );
};

const GuidedEstimatorModal = ({ liftKey, liftName, unitSystem, onClose, onApply }) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('5');

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 1;
  const calculated1RM = r === 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-md bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-base font-bold text-white">Guided 1RM Calculator</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Enter the heaviest weight you have lifted on <strong className="text-brand-cyan">{liftName}</strong> and how many clean reps you achieved.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Weight Lifted ({unitSystem.toUpperCase()})
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 80"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reps Completed (1 - 12 reps)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 3, 5, 6, 8, 10].map((rNum) => (
                <button
                  key={rNum}
                  type="button"
                  onClick={() => setReps(rNum.toString())}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-colors ${
                    reps === rNum.toString()
                      ? 'bg-brand-cyan text-dark-950'
                      : 'bg-dark-800 text-slate-400 hover:text-white border border-dark-700'
                  }`}
                >
                  {rNum}
                </button>
              ))}
            </div>
          </div>

          {w > 0 && (
            <div className="p-4 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Calculated Epley 1RM</span>
                <span className="text-lg font-mono font-black text-brand-cyan">
                  {calculated1RM} {unitSystem.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-dark-900/60 text-slate-300 border border-dark-700">
                {r <= 5 ? '95% High Confidence' : '85% Good Estimate'}
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={!w}
            onClick={() => onApply(weight, reps)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-950 font-bold text-sm shadow hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>Set {calculated1RM} {unitSystem.toUpperCase()} Baseline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
