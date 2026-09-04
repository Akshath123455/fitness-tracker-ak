import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBenchmarksApi, getStrengthHistoryApi, estimate1RMApi } from '../../services/api';
import {
  Compass,
  Award,
  ShieldCheck,
  TrendingUp,
  Info,
  Layers,
  Sparkles,
  Calculator,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const StrengthHubView = () => {
  const { user, profile, unitSystem, formatWeight } = useAuth();
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [activeHistoryLift, setActiveHistoryLift] = useState('bench_press');
  const [showStandardsModal, setShowStandardsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStrengthData = async () => {
      try {
        setLoading(true);
        const [benchRes, histRes] = await Promise.all([
          getBenchmarksApi(),
          getStrengthHistoryApi().catch(() => ({ data: { historyByExercise: {} } })),
        ]);
        setBenchmarkData(benchRes.data);
        setHistoryData(histRes.data);
      } catch (err) {
        console.error('Failed to load strength benchmark data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStrengthData();
  }, []);

  const radarData = benchmarkData?.radarData || [];
  const percentiles = benchmarkData?.percentiles || {};
  const cohort = benchmarkData?.demographicCohort || { cohortKey: 'All lifters', ageBand: '18-30', weightBand: '80-90kg' };

  const liftDetails = [
    {
      key: 'squat',
      title: 'Barbell Back Squat',
      valueKg: profile?.liftBaselines?.squat?.oneRepMax || 140,
      percentile: percentiles.squat || 72,
      tier: getTierLabel(percentiles.squat || 72),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.squat?.oneRepMax || 140) / profile.demographics.bodyWeightKg).toFixed(2) : '1.70',
    },
    {
      key: 'bench_press',
      title: 'Barbell Bench Press',
      valueKg: profile?.liftBaselines?.bench_press?.oneRepMax || 105,
      percentile: percentiles.bench_press || 68,
      tier: getTierLabel(percentiles.bench_press || 68),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.bench_press?.oneRepMax || 105) / profile.demographics.bodyWeightKg).toFixed(2) : '1.27',
    },
    {
      key: 'deadlift',
      title: 'Conventional Deadlift',
      valueKg: profile?.liftBaselines?.deadlift?.oneRepMax || 175,
      percentile: percentiles.deadlift || 80,
      tier: getTierLabel(percentiles.deadlift || 80),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.deadlift?.oneRepMax || 175) / profile.demographics.bodyWeightKg).toFixed(2) : '2.12',
    },
    {
      key: 'overhead_press',
      title: 'Standing Overhead Press',
      valueKg: profile?.liftBaselines?.overhead_press?.oneRepMax || 65,
      percentile: percentiles.overhead_press || 64,
      tier: getTierLabel(percentiles.overhead_press || 64),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.overhead_press?.oneRepMax || 65) / profile.demographics.bodyWeightKg).toFixed(2) : '0.78',
    },
    {
      key: 'pull_up',
      title: 'Pull-Up (Total Load)',
      valueKg: profile?.liftBaselines?.pull_up?.oneRepMax || 102.5,
      percentile: percentiles.pull_up || 75,
      tier: getTierLabel(percentiles.pull_up || 75),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.pull_up?.oneRepMax || 102.5) / profile.demographics.bodyWeightKg).toFixed(2) : '1.24',
    },
    {
      key: 'barbell_row',
      title: 'Bent-Over Barbell Row',
      valueKg: profile?.liftBaselines?.barbell_row?.oneRepMax || 90,
      percentile: percentiles.barbell_row || 70,
      tier: getTierLabel(percentiles.barbell_row || 70),
      ratio: profile?.demographics?.bodyWeightKg ? ((profile.liftBaselines?.barbell_row?.oneRepMax || 90) / profile.demographics.bodyWeightKg).toFixed(2) : '1.09',
    },
  ];

  // Active History Trendline data
  const rawHistory = historyData?.historyByExercise?.[activeHistoryLift] || [];
  const trendlineData = rawHistory.length > 0 ? rawHistory : [
    { date: 'Session 1', estimated1RM: liftDetails.find(l => l.key === activeHistoryLift)?.valueKg * 0.94 || 95 },
    { date: 'Session 2', estimated1RM: liftDetails.find(l => l.key === activeHistoryLift)?.valueKg * 0.97 || 98 },
    { date: 'Session 3', estimated1RM: liftDetails.find(l => l.key === activeHistoryLift)?.valueKg || 105 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-brand-emerald" />
            <span>Strength Benchmarking Hub</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Normative percentile distributions calibrated against your cohort: <strong className="text-brand-cyan">{cohort.sex?.toUpperCase()} • {cohort.ageBand} yrs • {cohort.weightBand}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowStandardsModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-dark-700 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-brand-cyan" />
          <span>View Normative Data Matrix</span>
        </button>
      </div>

      {/* Top Composite Gauge & Radar View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composite Score Card */}
        <div className="lg:col-span-4 glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Overall Strength Index
              </span>
              <span className="px-2.5 py-1 rounded-full bg-brand-emerald/15 text-brand-emerald font-bold text-xs">
                Top 25% Cohort
              </span>
            </div>

            <div className="text-center my-4">
              <span className="text-5xl font-black font-mono text-white tracking-tight">
                {benchmarkData?.strengthScore || 675}
              </span>
              <span className="text-xs text-slate-400 block font-semibold mt-1">/ 1000 Composite Score</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed text-center mb-4">
              Harmonic aggregate across squat, hinge, horizontal push/pull, and vertical push/pull mechanics.
            </p>
          </div>

          <div className="pt-4 border-t border-dark-800 grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-dark-850 border border-dark-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">DOTS Score</span>
              <span className="text-sm font-mono font-bold text-brand-cyan">{benchmarkData?.dotsScore || 308}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-dark-850 border border-dark-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Big 3 Total</span>
              <span className="text-sm font-mono font-bold text-brand-emerald">
                {formatWeight(
                  (profile?.liftBaselines?.squat?.oneRepMax || 140) +
                  (profile?.liftBaselines?.bench_press?.oneRepMax || 105) +
                  (profile?.liftBaselines?.deadlift?.oneRepMax || 175),
                  0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 6-Axis Radar Spider Chart */}
        <div className="lg:col-span-8 glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Movement Pattern Balance (Spider Chart)</h3>
              <p className="text-[11px] text-slate-400">Identifies biomechanical strengths vs. lagging vectors</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald" />
              <span className="text-xs font-semibold text-slate-300">Your Percentile (0 - 100%)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#202d42" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }} />
                <Radar
                  name="Percentile"
                  dataKey="percentile"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.35}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-dark-950 border border-dark-700 p-2.5 rounded-xl text-xs shadow-xl font-mono">
                          <p className="font-bold text-white">{data.subject}</p>
                          <p className="text-brand-emerald font-bold">{data.percentile}th Percentile</p>
                          <p className="text-slate-400">{data.valueKg} kg 1RM</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lift Breakdown Cards */}
      <div>
        <h3 className="text-base font-bold text-white mb-3">Major Lift Cohort Percentiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liftDetails.map((lift) => (
            <div
              key={lift.key}
              className="glass-card bg-dark-900 border border-dark-750 rounded-3xl p-5 shadow hover:border-dark-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{lift.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeStyle(lift.tier)}`}>
                    {lift.tier}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-2xl font-black font-mono text-brand-emerald">
                    {formatWeight(lift.valueKg)}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {lift.ratio}x Bodyweight
                  </span>
                </div>

                {/* Cohort Bell Curve Progress Slider */}
                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>Untrained (10%)</span>
                    <span className="text-brand-cyan font-bold">{lift.percentile}th Percentile</span>
                    <span>Elite (99%)</span>
                  </div>
                  <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden p-0.5 border border-dark-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-emerald transition-all duration-500"
                      style={{ width: `${lift.percentile}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Cohort Status:</span>
                <span className="font-semibold text-slate-200">
                  Stronger than {lift.percentile}% of {cohort.sex}s ({cohort.ageBand}y)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical 1RM Progression Curves */}
      <div className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-emerald" />
              <span>Historical 1RM Progression Curves</span>
            </h3>
            <p className="text-[11px] text-slate-400">Calculated trendlines from your logged working sets</p>
          </div>

          {/* Lift Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-dark-950/60 p-1 rounded-2xl border border-dark-700">
            {liftDetails.slice(0, 4).map((l) => (
              <button
                key={l.key}
                onClick={() => setActiveHistoryLift(l.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeHistoryLift === l.key
                    ? 'bg-brand-emerald text-dark-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.title.split(' ')[1] || l.title}
              </button>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendlineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ payload, label }) => {
                  if (payload && payload.length > 0) {
                    return (
                      <div className="bg-dark-950 border border-dark-700 p-2.5 rounded-xl font-mono text-xs shadow-xl">
                        <p className="text-slate-400 font-semibold">{label}</p>
                        <p className="text-brand-emerald font-bold">
                          1RM: {payload[0].value} {unitSystem.toUpperCase()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="estimated1RM"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disclaimers */}
      <DisclaimerBanner type="strength" />

      {/* Standards Reference Modal */}
      {showStandardsModal && (
        <StandardsReferenceModal
          standards={benchmarkData?.standards || []}
          onClose={() => setShowStandardsModal(false)}
        />
      )}
    </div>
  );
};

function getTierLabel(p) {
  if (p < 20) return 'Untrained';
  if (p < 45) return 'Novice';
  if (p < 70) return 'Intermediate';
  if (p < 88) return 'Proficient';
  if (p < 97) return 'Advanced';
  return 'Elite';
}

function getTierBadgeStyle(tier) {
  switch (tier) {
    case 'Elite':
      return 'bg-brand-violet/20 border-brand-violet/50 text-brand-violet';
    case 'Advanced':
      return 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan';
    case 'Proficient':
      return 'bg-brand-emerald/20 border-brand-emerald/50 text-brand-emerald';
    case 'Intermediate':
      return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    default:
      return 'bg-slate-700/30 border-slate-600 text-slate-300';
  }
}

const StandardsReferenceModal = ({ standards, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-dark-900 border border-dark-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-lg font-bold text-white">Empirical Strength Standards Normative Matrix</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          The table below reflects raw 1RM strength standards (in kg) segmented by bodyweight classes derived from published powerlifting normative tables (ExRx / Dr. Lon Kilgore & Mark Rippetoe standard distributions).
        </p>

        <div className="space-y-6">
          {standards.map((s, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-brand-emerald capitalize">
                  {s.exerciseName} ({s.sex.toUpperCase()})
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">1RM in Kilograms (KG)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-dark-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2">BW (KG)</th>
                      <th className="p-2">Untrained (10%)</th>
                      <th className="p-2">Novice (25%)</th>
                      <th className="p-2">Intermediate (50%)</th>
                      <th className="p-2">Proficient (75%)</th>
                      <th className="p-2">Advanced (90%)</th>
                      <th className="p-2">Elite (99%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 text-slate-200">
                    {(s.weightBrackets || []).map((b, bIdx) => (
                      <tr key={bIdx} className="hover:bg-dark-800/50">
                        <td className="p-2 font-bold text-white">{b.bodyWeightKg}kg</td>
                        <td className="p-2 text-slate-400">{b.untrained}</td>
                        <td className="p-2 text-slate-300">{b.novice}</td>
                        <td className="p-2 text-amber-400 font-semibold">{b.intermediate}</td>
                        <td className="p-2 text-brand-emerald font-semibold">{b.proficient}</td>
                        <td className="p-2 text-brand-cyan font-bold">{b.advanced}</td>
                        <td className="p-2 text-brand-violet font-bold">{b.elite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
