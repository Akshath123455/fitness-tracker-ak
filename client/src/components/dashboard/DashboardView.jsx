import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { getActiveProgramApi, getWorkoutsApi, getBenchmarksApi } from '../../services/api';
import {
  Play,
  Flame,
  Zap,
  Award,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
  RotateCw,
  Dumbbell,
  CheckCircle,
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const DashboardView = ({ onNavigate }) => {
  const { user, profile, unitSystem, formatWeight, hasCompletedOnboarding } = useAuth();
  const { startWorkoutFromDay } = useWorkout();

  const [activeProgramData, setActiveProgramData] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [benchmarksData, setBenchmarksData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [progRes, workoutsRes, benchRes] = await Promise.all([
        getActiveProgramApi().catch(() => ({ data: null })),
        getWorkoutsApi().catch(() => ({ data: { logs: [], summary: {} } })),
        getBenchmarksApi().catch(() => ({ data: null })),
      ]);

      setActiveProgramData(progRes.data);
      setWorkoutStats(workoutsRes.data);
      setBenchmarksData(benchRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartTodayWorkout = () => {
    if (!activeProgramData?.currentDay) return;
    startWorkoutFromDay(
      activeProgramData.currentDay,
      activeProgramData.program?._id,
      activeProgramData.program?.currentWeekNumber || 1
    );
    onNavigate('active-workout');
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl bg-dark-900 border border-dark-700">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center mx-auto mb-4 glow-emerald">
            <Sparkles className="w-8 h-8 text-dark-950 font-bold" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Welcome to ApexPulse AI</h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
            To generate your custom periodized program and calculate your strength score against peer cohorts, complete our 2-minute biometric onboarding.
          </p>
          <button
            onClick={() => onNavigate('onboarding')}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-sm shadow-xl hover:opacity-95 transition-all glow-emerald flex items-center gap-2 mx-auto"
          >
            <span>Launch Training Profile Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const todayWorkout = activeProgramData?.currentDay;
  const program = activeProgramData?.program;
  const adaptations = activeProgramData?.adaptations?.recommendations || [];
  const strengthScore = profile?.compositeMetrics?.strengthScore || benchmarksData?.strengthScore || 620;

  // Prepare Radar Data
  const radarPoints = benchmarksData?.radarData || [
    { subject: 'Squat', percentile: 72 },
    { subject: 'Bench', percentile: 68 },
    { subject: 'Deadlift', percentile: 80 },
    { subject: 'OHP', percentile: 64 },
    { subject: 'Pull-Up', percentile: 75 },
    { subject: 'Row', percentile: 70 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Banner: AI Adaptive Insights & Alerts */}
      {adaptations.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-emerald/10 via-dark-900 to-brand-cyan/10 border border-brand-emerald/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-emerald/20 text-brand-emerald shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>{adaptations[0].title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald uppercase font-mono">
                  Adaptive Engine
                </span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 max-w-2xl">{adaptations[0].reason}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-brand-emerald border border-brand-emerald/40 text-xs font-bold shrink-0 transition-colors"
          >
            Review in Planner
          </button>
        </div>
      )}

      {/* Main Grid: Today's Workout Hero (Left) & Strength Score Radar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Workout Hero */}
        <div className="lg:col-span-7 glass-panel bg-dark-900/90 border border-dark-750 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-emerald/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-brand-emerald/15 text-brand-emerald text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-brand-emerald/30">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Week {program?.currentWeekNumber || 1} • Day {todayWorkout?.dayNumber || 1}</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {program?.periodizationType?.toUpperCase()} Periodization
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                ~{todayWorkout?.estimatedDurationMin || 60} min
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {todayWorkout?.dayName || 'Scheduled Training Session'}
            </h1>
            <p className="text-xs text-slate-300 mb-5">
              Focus: <span className="font-semibold text-brand-cyan">{todayWorkout?.focusCategory || 'Compound Movement Pattern'}</span>
            </p>

            {/* Exercise Preview List */}
            <div className="space-y-2 mb-6">
              {(todayWorkout?.exercises || []).slice(0, 4).map((ex, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 rounded-xl bg-dark-850/80 border border-dark-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-dark-800 text-slate-400 font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-200">{ex.exerciseName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                    <span>{ex.targetSets} sets</span>
                    <span className="text-brand-emerald font-bold">
                      {ex.sets?.[0]?.prescribedWeightKg > 0 ? formatWeight(ex.sets[0].prescribedWeightKg) : 'BW/RPE 8'}
                    </span>
                  </div>
                </div>
              ))}
              {(todayWorkout?.exercises || []).length > 4 && (
                <p className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                  + {(todayWorkout.exercises.length - 4)} accessory & isolation movements
                </p>
              )}
            </div>
          </div>

          {/* Action Launch Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-dark-800">
            <button
              onClick={handleStartTodayWorkout}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition-all glow-emerald tap-target-btn"
            >
              <Play className="w-4 h-4 fill-dark-950" />
              <span>Start In-Gym Session</span>
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-200 font-semibold text-xs border border-dark-600 transition-colors"
            >
              View Full Program
            </button>
          </div>
        </div>

        {/* Strength Score & Radar Card */}
        <div className="lg:col-span-5 glass-panel bg-dark-900/90 border border-dark-750 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-emerald/15 text-brand-emerald">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Composite Strength Score</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Cohort: {profile?.compositeMetrics?.demographicCohortKey || 'Peer Benchmark'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-brand-emerald">{strengthScore}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">/ 1000 MAX</span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-52 w-full my-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarPoints}>
                  <PolarGrid stroke="#202d42" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                  <Radar
                    name="Percentile"
                    dataKey="percentile"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-cyan" />
              <span>DOTS: {profile?.compositeMetrics?.dotsScore || 295}</span>
            </div>
            <button
              onClick={() => onNavigate('strength')}
              className="text-xs font-bold text-brand-emerald hover:underline flex items-center gap-1"
            >
              <span>Explore Benchmarks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row: Stats, Streaks & Quick AI Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak & Consistency */}
        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-750 flex items-center justify-between shadow">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Consistency Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-amber-400">{user?.streak?.current || 14}</span>
              <span className="text-xs text-slate-400 font-semibold">Days Unbroken</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Longest: {user?.streak?.longest || 28} Days
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Total Volume */}
        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-750 flex items-center justify-between shadow">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Logged Volume
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-brand-cyan">
                {formatWeight(workoutStats?.summary?.totalVolumeKg || 4850, 0)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Across {workoutStats?.summary?.totalLoggedWorkouts || 3} logged sessions
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shadow">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-750 flex items-center justify-between shadow">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Badges Unlocked
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-brand-violet">{user?.badges?.length || 4}</span>
              <span className="text-xs text-slate-400 font-semibold">Trophies</span>
            </div>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-[10px] font-bold text-brand-violet hover:underline block mt-1"
            >
              View Badges & Leaderboard →
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center text-brand-violet shadow">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* AI Quick Chat Widget */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-dark-900 to-dark-850 border border-brand-cyan/30 flex flex-col justify-between shadow">
          <div>
            <span className="text-[11px] text-brand-cyan font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Apex AI Coach</span>
            </span>
            <p className="text-xs text-slate-300 font-medium">"Swap today's squat due to knee tightness" or check form cues.</p>
          </div>
          <button
            onClick={() => onNavigate('coach')}
            className="mt-3 w-full py-2 rounded-xl bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/40 text-xs font-bold transition-colors text-center"
          >
            Open AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
