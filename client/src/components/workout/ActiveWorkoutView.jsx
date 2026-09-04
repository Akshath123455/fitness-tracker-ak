import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { getExerciseSubstitutesApi, getExerciseFormCuesApi } from '../../services/api';
import {
  Check,
  Plus,
  Minus,
  Timer,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  X,
  Dumbbell,
  Award,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ActiveWorkoutView = ({ onFinishNavigate }) => {
  const { unitSystem, formatWeight, toDisplayWeight, toKgWeight } = useAuth();
  const {
    activeWorkout,
    updateSetInActiveWorkout,
    checkOffSet,
    finishWorkout,
    cancelActiveWorkout,
    startRestTimer,
  } = useWorkout();

  const [swapModalExercise, setSwapModalExercise] = useState(null); // { index, exercise }
  const [cuesModalExercise, setCuesModalExercise] = useState(null); // { slug, name }
  const [substitutesList, setSubstitutesList] = useState([]);
  const [cuesData, setCuesData] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeWorkout) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-3xl bg-dark-900 border border-dark-700">
          <Dumbbell className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">No Active In-Gym Workout</h2>
          <p className="text-xs text-slate-400 mb-6">
            Start today's scheduled session from your Dashboard or Planner to begin tracking live sets with rest timers.
          </p>
          <button
            onClick={() => onFinishNavigate('dashboard')}
            className="px-6 py-2.5 rounded-xl bg-brand-emerald text-dark-950 font-bold text-xs shadow hover:opacity-95"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleOpenSwap = async (exerciseIndex, exercise) => {
    try {
      setSwapModalExercise({ index: exerciseIndex, exercise });
      const { data } = await getExerciseSubstitutesApi(exercise.exerciseId);
      setSubstitutesList(data.substitutes || []);
    } catch (e) {
      console.error('Failed to load substitutes:', e);
      setSubstitutesList([]);
    }
  };

  const handleApplySwap = (replacement) => {
    if (!swapModalExercise) return;
    const { index } = swapModalExercise;

    // Mutate exercise in active workout
    const ex = activeWorkout.exercises[index];
    ex.exerciseId = replacement._id;
    ex.exerciseName = replacement.name;
    ex.slug = replacement.slug;
    ex.movementPattern = replacement.movementPattern;
    ex.substitutedFromId = ex.exerciseId;
    ex.notes = `Substituted with ${replacement.name}`;

    setSwapModalExercise(null);
  };

  const handleOpenCues = async (slug, name) => {
    try {
      setCuesModalExercise({ slug, name });
      const { data } = await getExerciseFormCuesApi(slug || name.toLowerCase().replace(/\s+/g, '_'));
      setCuesData(data);
    } catch (e) {
      setCuesData({
        exerciseName: name,
        cues: [
          'Maintain intra-abdominal brace throughout the movement.',
          'Control the eccentric phase for 2-3 seconds.',
          'Drive through the midfoot with full range of motion.',
        ],
        commonMistakes: ['Rushing through reps', 'Losing core brace'],
      });
    }
  };

  const handleCompleteWorkout = async () => {
    setIsFinishing(true);
    try {
      await finishWorkout();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      onFinishNavigate('dashboard');
    } catch (e) {
      console.error('Workout save failed:', e);
    } finally {
      setIsFinishing(false);
    }
  };

  // Compute live workout progress
  const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header Card */}
      <div className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
            <span className="text-[11px] font-mono font-bold text-brand-emerald uppercase tracking-wider">
              In-Gym Live Session
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{activeWorkout.workoutName}</h1>
          <p className="text-xs text-slate-400">
            {completedSets} of {totalSets} sets completed ({progressPct}%)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={cancelActiveWorkout}
            className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-dark-700 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleCompleteWorkout}
            disabled={isFinishing}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-xs shadow-lg hover:opacity-95 transition-opacity glow-emerald"
          >
            {isFinishing ? 'Saving...' : 'Finish Workout'}
          </button>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-6">
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <div
            key={exIdx}
            className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
          >
            {/* Exercise Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dark-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-dark-800 text-brand-emerald font-mono font-bold flex items-center justify-center text-xs border border-dark-700">
                    {exIdx + 1}
                  </span>
                  <h3 className="text-base font-bold text-white">{exercise.exerciseName}</h3>
                </div>
                {exercise.notes && (
                  <p className="text-[11px] text-slate-400 mt-1 italic pl-8">{exercise.notes}</p>
                )}
              </div>

              {/* Action Buttons: Form Cues & Swap */}
              <div className="flex items-center gap-2 pl-8 sm:pl-0">
                <button
                  type="button"
                  onClick={() => handleOpenCues(exercise.slug, exercise.exerciseName)}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-medium border border-dark-700 flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Form Cues</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSwap(exIdx, exercise)}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-medium border border-dark-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Swap</span>
                </button>
              </div>
            </div>

            {/* Sets Grid */}
            <div className="space-y-2.5">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-slate-400 px-3 font-semibold">
                <span className="col-span-1">Set</span>
                <span className="col-span-3">Weight ({unitSystem.toUpperCase()})</span>
                <span className="col-span-3">Reps</span>
                <span className="col-span-2">RPE</span>
                <span className="col-span-2">Est. 1RM</span>
                <span className="col-span-1 text-right">Done</span>
              </div>

              {exercise.sets.map((set, setIdx) => {
                const displayWeight = toDisplayWeight(set.weightKg);
                // Calculate real-time e1RM
                const e1rm = set.reps > 1 ? Math.round(set.weightKg * (1 + set.reps / 30) * 10) / 10 : set.weightKg;

                return (
                  <div
                    key={setIdx}
                    className={`p-3 rounded-2xl border transition-all ${
                      set.completed
                        ? 'bg-brand-emerald/10 border-brand-emerald/40'
                        : 'bg-dark-850 border-dark-700/80 hover:border-dark-600'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5">
                      {/* Set Tag */}
                      <div className="sm:col-span-1 flex items-center justify-between sm:justify-start">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          #{set.setNumber}
                        </span>
                        {set.isWarmup && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 font-bold uppercase">
                            W
                          </span>
                        )}
                      </div>

                      {/* Weight Selector */}
                      <div className="sm:col-span-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const step = unitSystem === 'lbs' ? 5 : 2.5;
                            const newDisplay = Math.max(0, displayWeight - step);
                            updateSetInActiveWorkout(exIdx, setIdx, { weightKg: toKgWeight(newDisplay) });
                          }}
                          className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={displayWeight || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSetInActiveWorkout(exIdx, setIdx, { weightKg: toKgWeight(val) });
                          }}
                          className="w-full text-center py-1.5 bg-dark-900 border border-dark-650 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-brand-emerald"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const step = unitSystem === 'lbs' ? 5 : 2.5;
                            const newDisplay = displayWeight + step;
                            updateSetInActiveWorkout(exIdx, setIdx, { weightKg: toKgWeight(newDisplay) });
                          }}
                          className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Reps Selector */}
                      <div className="sm:col-span-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateSetInActiveWorkout(exIdx, setIdx, { reps: Math.max(1, set.reps - 1) })
                          }
                          className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) =>
                            updateSetInActiveWorkout(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })
                          }
                          className="w-full text-center py-1.5 bg-dark-900 border border-dark-650 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-brand-emerald"
                        />
                        <button
                          type="button"
                          onClick={() => updateSetInActiveWorkout(exIdx, setIdx, { reps: set.reps + 1 })}
                          className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* RPE Selector */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-start gap-1">
                        <span className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase">RPE</span>
                        <select
                          value={set.rpe || 8}
                          onChange={(e) =>
                            updateSetInActiveWorkout(exIdx, setIdx, { rpe: parseFloat(e.target.value) })
                          }
                          className="w-full py-1.5 px-2 bg-dark-900 border border-dark-650 rounded-lg text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-brand-emerald"
                        >
                          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rVal) => (
                            <option key={rVal} value={rVal}>
                              @{rVal}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Live e1RM preview */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-start">
                        <span className="sm:hidden text-[10px] text-slate-400 font-semibold uppercase">e1RM</span>
                        <span className="text-xs font-mono font-bold text-brand-cyan">
                          {formatWeight(e1rm)}
                        </span>
                      </div>

                      {/* Check-off Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => checkOffSet(exIdx, setIdx)}
                          className={`w-full sm:w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            set.completed
                              ? 'bg-brand-emerald text-dark-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-brand-emerald/50'
                              : 'bg-dark-800 hover:bg-dark-700 text-slate-400 border border-dark-600'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Swap Modal */}
      {swapModalExercise && (
        <ExerciseSwapModal
          exercise={swapModalExercise.exercise}
          substitutes={substitutesList}
          onClose={() => setSwapModalExercise(null)}
          onSelectSubstitute={handleApplySwap}
        />
      )}

      {/* Cues Modal */}
      {cuesModalExercise && cuesData && (
        <FormCuesModal
          cuesData={cuesData}
          onClose={() => {
            setCuesModalExercise(null);
            setCuesData(null);
          }}
        />
      )}
    </div>
  );
};

const ExerciseSwapModal = ({ exercise, substitutes, onClose, onSelectSubstitute }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-emerald" />
            <h3 className="text-base font-bold text-white">Substitute Movement</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Swapping: <strong className="text-white">{exercise.exerciseName}</strong> ({exercise.movementPattern} pattern). Choose a biomechanically aligned alternative:
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {substitutes.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">Loading matching substitutes...</p>
          ) : (
            substitutes.map((sub) => (
              <div
                key={sub._id}
                onClick={() => onSelectSubstitute(sub)}
                className="p-3.5 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-dark-700 hover:border-brand-emerald cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-brand-emerald block">
                    {sub.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {sub.equipmentRequired} • {sub.movementPattern.replace('_', ' ')}
                  </span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-dark-800 group-hover:bg-brand-emerald text-slate-300 group-hover:text-dark-950 text-xs font-bold transition-colors">
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FormCuesModal = ({ cuesData, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-base font-bold text-white">{cuesData.exerciseName} Technique</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider mb-2">
            Execution Cues
          </h4>
          <ul className="space-y-1.5">
            {(cuesData.cues || []).map((cue, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-brand-emerald/20 text-brand-emerald font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{cue}</span>
              </li>
            ))}
          </ul>
        </div>

        {cuesData.commonMistakes?.length > 0 && (
          <div className="pt-2 border-t border-dark-800">
            <h4 className="text-xs font-bold text-brand-rose uppercase tracking-wider mb-2">
              Common Faults to Avoid
            </h4>
            <ul className="space-y-1">
              {cuesData.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
