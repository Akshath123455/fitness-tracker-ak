import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reassessProfileApi, updatePreferencesApi } from '../../services/api';
import {
  User,
  Scale,
  Sparkles,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Check,
  Save,
  Download,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfileView = ({ onNavigate }) => {
  const { user, profile, unitSystem, toggleUnitSystem, refreshProfile, formatWeight, toDisplayWeight, toKgWeight } = useAuth();
  const [retestModal, setRetestModal] = useState(false);
  const [newBodyWeight, setNewBodyWeight] = useState(profile?.demographics?.bodyWeightKg || 80);
  const [updatedBaselines, setUpdatedBaselines] = useState({
    squat: profile?.liftBaselines?.squat?.oneRepMax || 140,
    bench_press: profile?.liftBaselines?.bench_press?.oneRepMax || 105,
    deadlift: profile?.liftBaselines?.deadlift?.oneRepMax || 175,
    overhead_press: profile?.liftBaselines?.overhead_press?.oneRepMax || 65,
    pull_up: profile?.liftBaselines?.pull_up?.oneRepMax || 102.5,
    barbell_row: profile?.liftBaselines?.barbell_row?.oneRepMax || 90,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleRetestSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const formattedBaselines = {};
      for (const [key, val] of Object.entries(updatedBaselines)) {
        formattedBaselines[key] = {
          oneRepMax: parseFloat(val) || 0,
          testedReps: 1,
          testedWeight: parseFloat(val) || 0,
          formulaUsed: 'retest_direct',
          lastUpdated: new Date(),
        };
      }

      await reassessProfileApi({
        bodyWeightKg: parseFloat(newBodyWeight) || profile?.demographics?.bodyWeightKg,
        liftBaselines: formattedBaselines,
      });

      await refreshProfile();
      confetti({ particleCount: 120, spread: 70 });
      setSuccessMsg('Re-assessment saved! Your Strength Score and percentiles have recalibrated.');
      setRetestModal(false);
    } catch (err) {
      console.error('Reassessment failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user, profile }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apexpulse_training_profile_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <User className="w-7 h-7 text-brand-emerald" />
            <span>Training Profile & Preferences</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your baseline biometric variables, periodic strength re-testing, and application settings.
          </p>
        </div>

        <button
          onClick={() => setRetestModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-xs shadow-lg hover:opacity-95 flex items-center gap-2 glow-emerald"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch 4-Week Re-Assessment</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-brand-emerald/15 border border-brand-emerald/40 text-brand-emerald text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Biometrics Card */}
        <div className="glass-panel p-5 rounded-3xl bg-dark-900 border border-dark-750 shadow space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Biometrics & Cohort
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Athlete Name</span>
              <span className="text-white font-bold">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Age</span>
              <span className="text-white font-bold">{profile?.demographics?.age} Years</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Biological Sex</span>
              <span className="text-white font-bold capitalize">{profile?.demographics?.sex}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Body Weight</span>
              <span className="text-brand-emerald font-bold">
                {formatWeight(profile?.demographics?.bodyWeightKg || 80)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Experience Tier</span>
              <span className="text-brand-cyan font-bold capitalize">
                {profile?.demographics?.experienceLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Equipment */}
        <div className="glass-panel p-5 rounded-3xl bg-dark-900 border border-dark-750 shadow space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Training Parameters
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Primary Objective</span>
              <span className="text-white font-bold capitalize">{profile?.goals?.primary?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Weekly Frequency</span>
              <span className="text-white font-bold">{profile?.schedule?.daysPerWeek} Days / Week</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Session Duration</span>
              <span className="text-white font-bold">{profile?.schedule?.sessionDurationMin} Minutes</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dark-800">
              <span className="text-slate-400">Equipment Access</span>
              <span className="text-brand-cyan font-bold capitalize">
                {profile?.equipment?.access?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Injury Safety Flags</span>
              <span className="text-rose-400 font-bold">
                {profile?.healthFlags?.injuries?.length > 0 ? profile.healthFlags.injuries.join(', ') : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* System Settings & Actions */}
        <div className="glass-panel p-5 rounded-3xl bg-dark-900 border border-dark-750 shadow space-y-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Preferences & Data
          </span>

          <div className="space-y-2.5">
            <button
              onClick={toggleUnitSystem}
              className="w-full py-2.5 px-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
            >
              <span>Unit System</span>
              <span className="font-mono font-bold text-brand-emerald">{unitSystem.toUpperCase()}</span>
            </button>

            <button
              onClick={handleExportData}
              className="w-full py-2.5 px-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
            >
              <span>Export Biometrics JSON</span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('onboarding')}
              className="w-full py-2.5 px-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-brand-cyan flex items-center justify-between transition-colors"
            >
              <span>Rerun Full Onboarding Wizard</span>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4-Week Reassessment Modal */}
      {retestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto bg-dark-900 border border-dark-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-lg font-bold text-white">4-6 Week Periodic Strength Re-Assessment</h3>
              </div>
              <button onClick={() => setRetestModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Log your updated tested maxes or current body weight. The benchmark engine will recalculate your composite Strength Score and shift your cohort percentile curve.
            </p>

            <form onSubmit={handleRetestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Body Weight ({unitSystem.toUpperCase()})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newBodyWeight}
                  onChange={(e) => setNewBodyWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(updatedBaselines).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 capitalize">
                      {key.replace('_', ' ')} 1RM ({unitSystem.toUpperCase()})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={val}
                      onChange={(e) =>
                        setUpdatedBaselines({ ...updatedBaselines, [key]: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-sm font-mono font-bold text-brand-emerald focus:outline-none focus:border-brand-emerald"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-sm shadow hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 glow-emerald"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Recalibrating Baselines...' : 'Save Re-Assessment & Recalculate'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
