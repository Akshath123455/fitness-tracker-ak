import React, { createContext, useContext, useState, useEffect } from 'react';
import { logWorkoutApi, syncOfflineWorkoutsApi } from '../services/api';
import confetti from 'canvas-confetti';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(() => {
    const saved = localStorage.getItem('apexpulse_active_workout');
    return saved ? JSON.parse(saved) : null;
  });

  const [restTimer, setRestTimer] = useState({
    active: false,
    remainingSeconds: 0,
    totalSeconds: 90,
    exerciseName: '',
  });

  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem('apexpulse_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  // Persist active workout state
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('apexpulse_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('apexpulse_active_workout');
    }
  }, [activeWorkout]);

  // Rest timer countdown ticker
  useEffect(() => {
    let interval = null;
    if (restTimer.active && restTimer.remainingSeconds > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev.remainingSeconds <= 1) {
            playChimeSound();
            return { ...prev, active: false, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.remainingSeconds]);

  // Web Audio API Synthesizer for Gym Chime
  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked', e);
    }
  };

  const startRestTimer = (seconds = 90, exerciseName = '') => {
    setRestTimer({
      active: true,
      remainingSeconds: seconds,
      totalSeconds: seconds,
      exerciseName,
    });
  };

  const adjustRestTimer = (deltaSeconds) => {
    setRestTimer((prev) => ({
      ...prev,
      remainingSeconds: Math.max(0, prev.remainingSeconds + deltaSeconds),
      totalSeconds: Math.max(prev.totalSeconds, prev.remainingSeconds + deltaSeconds),
    }));
  };

  const stopRestTimer = () => {
    setRestTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }));
  };

  const startWorkoutFromDay = (programDay, programId, weekNumber = 1) => {
    const formattedExercises = programDay.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      slug: ex.slug,
      movementPattern: ex.movementPattern,
      notes: ex.notes || '',
      sets: ex.sets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.prescribedWeightKg || 0,
        reps: s.targetReps || 8,
        rpe: s.targetRpe || 8,
        isWarmup: s.isWarmup || false,
        completed: false,
        estimated1RM: 0,
        restTakenSeconds: s.restSeconds || 90,
      })),
    }));

    const workoutSession = {
      clientSyncId: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      programId: programId || null,
      workoutName: programDay.dayName || 'Custom Workout',
      weekNumber,
      dayNumber: programDay.dayNumber || 1,
      startTime: Date.now(),
      overallRpe: 8,
      fatigueRating: 5,
      notes: '',
      exercises: formattedExercises,
    };

    setActiveWorkout(workoutSession);
  };

  const updateSetInActiveWorkout = (exerciseIndex, setIndex, updatedFields) => {
    if (!activeWorkout) return;

    setActiveWorkout((prev) => {
      const newExercises = [...prev.exercises];
      const targetEx = { ...newExercises[exerciseIndex] };
      const targetSets = [...targetEx.sets];

      targetSets[setIndex] = { ...targetSets[setIndex], ...updatedFields };
      targetEx.sets = targetSets;
      newExercises[exerciseIndex] = targetEx;

      return { ...prev, exercises: newExercises };
    });
  };

  const checkOffSet = (exerciseIndex, setIndex) => {
    if (!activeWorkout) return;
    const currentSet = activeWorkout.exercises[exerciseIndex].sets[setIndex];
    const isNowCompleted = !currentSet.completed;

    updateSetInActiveWorkout(exerciseIndex, setIndex, { completed: isNowCompleted });

    if (isNowCompleted) {
      const restSec = currentSet.restTakenSeconds || 90;
      startRestTimer(restSec, activeWorkout.exercises[exerciseIndex].exerciseName);
    }
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return null;

    const durationSeconds = Math.round((Date.now() - activeWorkout.startTime) / 1000);
    const payload = {
      ...activeWorkout,
      durationSeconds: Math.max(60, durationSeconds),
      status: 'completed',
    };

    if (navigator.onLine) {
      try {
        const { data } = await logWorkoutApi(payload);
        if (data.prsAchieved && data.prsAchieved.length > 0) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
        setActiveWorkout(null);
        stopRestTimer();
        return data;
      } catch (err) {
        console.warn('[Workout] Logging failed online, buffering to offline queue...', err);
        queueOfflineWorkout(payload);
      }
    } else {
      queueOfflineWorkout(payload);
    }

    setActiveWorkout(null);
    stopRestTimer();
    return { workout: payload, isOfflineSaved: true };
  };

  const queueOfflineWorkout = (payload) => {
    const updated = [...offlineQueue, payload];
    setOfflineQueue(updated);
    localStorage.setItem('apexpulse_offline_queue', JSON.stringify(updated));
  };

  const flushOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('apexpulse_offline_queue') || '[]');
    if (queue.length === 0) return;

    try {
      await syncOfflineWorkoutsApi(queue);
      setOfflineQueue([]);
      localStorage.removeItem('apexpulse_offline_queue');
      console.log(`[OfflineSync] Flushed ${queue.length} workouts to server.`);
    } catch (e) {
      console.error('[OfflineSync] Flush failed:', e);
    }
  };

  const cancelActiveWorkout = () => {
    setActiveWorkout(null);
    stopRestTimer();
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        restTimer,
        isOnline,
        offlineQueueLength: offlineQueue.length,
        startWorkoutFromDay,
        updateSetInActiveWorkout,
        checkOffSet,
        finishWorkout,
        cancelActiveWorkout,
        startRestTimer,
        adjustRestTimer,
        stopRestTimer,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
