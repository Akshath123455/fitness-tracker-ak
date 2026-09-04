import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { getActiveProgramApi, regenerateProgramApi, applyAdaptationApi } from '../../services/api';
import {
  Calendar,
  Layers,
  Sparkles,
  Play,
  RotateCw,
  ShieldAlert,
  ChevronRight,
  Clock,
  Dumbbell,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProgramPlannerView = ({ onStartWorkoutNavigate }) => {
  const { profile, unitSystem, formatWeight } = useAuth();
  const { startWorkoutFromDay } = useWorkout();

  const [programData, setProgramData] = useState(null);
  const [selectedWeekNum, setSelectedWeekNum] = useState(1);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const { data } = await getActiveProgramApi();
      setProgramData(data);
      if (data.program?.currentWeekNumber) {
        setSelectedWeekNum(data.program.currentWeekNumber);
      }
    } catch (err) {
      console.error('Failed to load program:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, []);

  const program = programData?.program;
  const weeks = program?.weeks || [];
  const currentWeek = weeks.find((w) => w.weekNumber === selectedWeekNum) || weeks[0];
  const days = currentWeek?.days || [];
  const selectedDay = days.find((d) => d.dayNumber === selectedDayNum) || days[0];

  const handleStartSession = (day) => {
    startWorkoutFromDay(day, program?._id, selectedWeekNum);
    onStartWorkoutNavigate('active-workout');
  };

  const handleTriggerDeload = async () => {
    try {
      await applyAdaptationApi({ action: 'TRIGGER_DELOAD' });
      await fetchProgram();
      confetti({ particleCount: 100, spread: 60 });
    } catch (e) {
      console.error('Deload activation failed', e);
    }
  };

  const handleRegenerate = async (periodizationPreference) => {
    try {
      setRegenerating(true);
      await regenerateProgramApi({ periodizationPreference });
      await fetchProgram();
      setShowRegenModal(false);
      confetti({ particleCount: 120, spread: 70 });
    } catch (e) {
      console.error('Regeneration failed', e);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-mono font-bold uppercase">
              {program?.periodizationType || 'Adaptive'} Engine
            </span>
            <span className="text-xs text-slate-400 font-semibold">{program?.durationWeeks || 4} Weeks Wave</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{program?.title || 'Periodized Program'}</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">{program?.description}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerDeload}
            className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
          >
            Activate Deload Week
          </button>
          <button
            onClick={() => setShowRegenModal(true)}
            className="px-4 py-2 rounded-2xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {weeks.map((week) => {
          const isSelected = selectedWeekNum === week.weekNumber;
          return (
            <button
              key={week.weekNumber}
              onClick={() => {
                setSelectedWeekNum(week.weekNumber);
                setSelectedDayNum(1);
              }}
              className={`px-5 py-3 rounded-2xl border text-left shrink-0 transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-emerald/20 to-brand-cyan/20 border-brand-emerald/60 text-white shadow-lg'
                  : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs font-mono font-black ${isSelected ? 'text-brand-emerald' : 'text-slate-300'}`}>
                  Week {week.weekNumber}
                </span>
                {week.isDeloadWeek && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DELOAD
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">{week.theme}</p>
            </button>
          );
        })}
      </div>

      {/* Day Cards Grid & Selected Workout Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Days List (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Week {selectedWeekNum} Schedule ({days.length} Sessions)
          </h3>
          {days.map((day) => {
            const isSelected = selectedDayNum === day.dayNumber;
            return (
              <div
                key={day.dayNumber}
                onClick={() => setSelectedDayNum(day.dayNumber)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-dark-850 border-brand-emerald text-white shadow-lg'
                    : 'bg-dark-900 border-dark-750 text-slate-300 hover:border-dark-600'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-dark-800 text-brand-cyan border border-dark-700">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">~{day.estimatedDurationMin}m</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{day.dayName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{day.focusCategory}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand-emerald' : 'text-slate-600'}`} />
              </div>
            );
          })}
        </div>

        {/* Selected Day Exercise Details (Right 8 cols) */}
        {selectedDay && (
          <div className="lg:col-span-8 glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-800 mb-5">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-emerald uppercase tracking-wider">
                    Workout Detail View
                  </span>
                  <h3 className="text-xl font-black text-white">{selectedDay.dayName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDay.exercises.length} Exercises • Prescribed with progressive overload load targets
                  </p>
                </div>
                <button
                  onClick={() => handleStartSession(selectedDay)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-xs shadow-lg hover:opacity-95 transition-opacity glow-emerald flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-dark-950" />
                  <span>Start This Session</span>
                </button>
              </div>

              {/* Exercise Prescription Table */}
              <div className="space-y-3">
                {selectedDay.exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-dark-850/80 border border-dark-700/80 hover:border-dark-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-dark-800 text-brand-emerald font-mono font-bold flex items-center justify-center text-[10px] border border-dark-700">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">{ex.exerciseName}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-slate-400 uppercase font-semibold border border-dark-700">
                        {ex.movementPattern?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Prescribed Sets */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-dark-900 border border-dark-750">
                        <span className="text-[10px] text-slate-400 block font-sans">Sets</span>
                        <span className="font-bold text-slate-200">{ex.targetSets} Working Sets</span>
                      </div>
                      <div className="p-2 rounded-xl bg-dark-900 border border-dark-750">
                        <span className="text-[10px] text-slate-400 block font-sans">Target Reps</span>
                        <span className="font-bold text-slate-200">{ex.sets?.[0]?.targetReps || 8} Reps</span>
                      </div>
                      <div className="p-2 rounded-xl bg-dark-900 border border-dark-750">
                        <span className="text-[10px] text-slate-400 block font-sans">Target Load</span>
                        <span className="font-bold text-brand-emerald">
                          {ex.sets?.[0]?.prescribedWeightKg > 0 ? formatWeight(ex.sets[0].prescribedWeightKg) : 'BW/RPE 8'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-dark-900 border border-dark-750">
                        <span className="text-[10px] text-slate-400 block font-sans">Target RPE</span>
                        <span className="font-bold text-brand-cyan">@{ex.sets?.[0]?.targetRpe || 8}</span>
                      </div>
                    </div>

                    {ex.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 italic pl-7">{ex.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regeneration Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-brand-cyan" />
                <h3 className="text-base font-bold text-white">Regenerate Program</h3>
              </div>
              <button onClick={() => setShowRegenModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select an architecture to re-calibrate your periodization schedule:
            </p>

            <div className="space-y-2">
              {[
                { id: 'linear', title: 'Linear Progression', desc: 'Predictable microloads for rapid strength consolidation' },
                { id: 'undulating', title: 'Daily Undulating (DUP)', desc: 'Alternating Hypertrophy, Power, and Strength stimuli' },
                { id: 'block', title: 'Block Periodization (6 Weeks)', desc: 'Accumulation -> Transmutation -> Realization peaking' },
              ].map((m) => (
                <button
                  key={m.id}
                  disabled={regenerating}
                  onClick={() => handleRegenerate(m.id)}
                  className="w-full p-3.5 text-left rounded-2xl bg-dark-850 hover:bg-dark-800 border border-dark-700 hover:border-brand-cyan transition-all"
                >
                  <p className="text-xs font-bold text-white">{m.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
