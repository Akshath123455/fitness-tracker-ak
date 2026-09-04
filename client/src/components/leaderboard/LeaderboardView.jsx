import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCohortLeaderboardApi, getUserBadgesApi, updatePreferencesApi } from '../../services/api';
import {
  Trophy,
  Award,
  Flame,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  Medal,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';

export const LeaderboardView = () => {
  const { user, profile, formatWeight } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [badgesData, setBadgesData] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'badges'
  const [isAnonymized, setIsAnonymized] = useState(user?.privacy?.anonymizeLeaderboardName || false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lbRes, badgeRes] = await Promise.all([
        getCohortLeaderboardApi().catch(() => ({ data: { rankings: [] } })),
        getUserBadgesApi().catch(() => ({ data: { badges: [] } })),
      ]);
      setLeaderboardData(lbRes.data);
      setBadgesData(badgeRes.data);
    } catch (e) {
      console.error('Failed to load leaderboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAnonymity = async () => {
    const newVal = !isAnonymized;
    setIsAnonymized(newVal);
    try {
      await updatePreferencesApi({ privacy: { anonymizeLeaderboardName: newVal } });
      await fetchData();
    } catch (e) {
      console.error('Failed to toggle anonymity:', e);
    }
  };

  const rankings = leaderboardData?.rankings || [];
  const badges = badgesData?.badges || [];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-violet/20 text-brand-violet text-xs font-mono font-bold uppercase border border-brand-violet/30">
              Fair Demographic Scoping
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Cohort Leaderboard & Badges</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ranked strictly within your demographic cohort ({profile?.demographics?.sex?.toUpperCase()} • {profile?.demographics?.age} yrs • {profile?.demographics?.bodyWeightKg} kg)
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-dark-900 p-1.5 rounded-2xl border border-dark-700">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-brand-emerald text-dark-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cohort Rankings
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-brand-violet text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Milestone Badges ({badges.filter((b) => b.isUnlocked).length}/{badges.length})
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Privacy & Opt-in Control */}
          <div className="glass-panel p-4 rounded-3xl bg-dark-900 border border-dark-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-cyan" />
              <div>
                <p className="text-xs font-bold text-white">Demographic Privacy Guard</p>
                <p className="text-[11px] text-slate-400">
                  We never cross-compare across dissimilar age bands or bodyweights to keep progress motivating and authentic.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAnonymity}
              className="px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-xs font-semibold text-slate-300 border border-dark-700 flex items-center gap-2 transition-colors shrink-0"
            >
              {isAnonymized ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-brand-emerald" />}
              <span>{isAnonymized ? 'Display Name Anonymized' : 'Display Name Public'}</span>
            </button>
          </div>

          {/* Rankings Table */}
          <div className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-6 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-950/60 text-slate-400 text-[10px] uppercase font-mono border-b border-dark-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Athlete</th>
                    <th className="p-3">Tier</th>
                    <th className="p-3">Strength Score</th>
                    <th className="p-3">DOTS</th>
                    <th className="p-3 text-right">Squat / Bench / DL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 font-medium">
                  {rankings.map((entry) => (
                    <tr
                      key={entry.rank}
                      className={`hover:bg-dark-850/60 transition-colors ${
                        entry.isCurrentUser ? 'bg-brand-emerald/10 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 font-mono">
                        {entry.rank === 1 ? (
                          <span className="flex items-center gap-1 text-amber-400 font-black">
                            <Crown className="w-4 h-4 fill-amber-400" /> 1
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="text-slate-300 font-bold">2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-600 font-bold">3</span>
                        ) : (
                          <span className="text-slate-500">#{entry.rank}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={entry.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-dark-700"
                          />
                          <div>
                            <span className={`text-xs ${entry.isCurrentUser ? 'text-brand-emerald font-bold' : 'text-white'}`}>
                              {entry.displayName} {entry.isCurrentUser && '(You)'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 capitalize text-slate-300">{entry.experienceLevel || 'Intermediate'}</td>

                      <td className="p-3 font-mono font-bold text-brand-emerald text-sm">
                        {entry.strengthScore}
                      </td>

                      <td className="p-3 font-mono text-brand-cyan">{entry.dotsScore || 305}</td>

                      <td className="p-3 font-mono text-right text-slate-300">
                        {entry.liftMaxesKg?.squat || 0} / {entry.liftMaxesKg?.bench_press || 0} / {entry.liftMaxesKg?.deadlift || 0} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Badges Showcase Tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                badge.isUnlocked
                  ? 'bg-dark-900 border-brand-violet/50 shadow-xl glow-cyan'
                  : 'bg-dark-900/50 border-dark-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      badge.isUnlocked
                        ? 'bg-gradient-to-tr from-brand-violet to-brand-cyan text-dark-950 font-bold shadow'
                        : 'bg-dark-800 text-slate-600'
                    }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  {badge.isUnlocked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold ${badge.isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                  {badge.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{badge.description}</p>
              </div>

              <div className="pt-3 border-t border-dark-800 mt-4 text-[10px] font-mono text-slate-500 uppercase">
                {badge.category} Category
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
