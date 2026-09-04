import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import {
  Activity,
  Dumbbell,
  Compass,
  Calendar,
  Bot,
  Trophy,
  User,
  Zap,
  Flame,
  WifiOff,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuthModal }) => {
  const { user, unitSystem, toggleUnitSystem, logout, hasCompletedOnboarding } = useAuth();
  const { activeWorkout, isOnline, offlineQueueLength } = useWorkout();
  const [profileDropdown, setProfileDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'strength', label: 'Benchmarks', icon: Compass },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'coach', label: 'AI Coach', icon: Bot, highlight: true },
    { id: 'leaderboard', label: 'Cohort & Badges', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5 text-dark-950 font-bold" />
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                APEX<span className="text-brand-emerald">PULSE</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                  AI
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Adaptive Strength Platform</p>
            </div>
          </button>

          {/* Offline & Sync status */}
          {!isOnline && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode ({offlineQueueLength} queued)</span>
            </div>
          )}
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-dark-950/70 p-1.5 rounded-2xl border border-dark-700/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-emerald/20 to-brand-cyan/20 text-brand-emerald border border-brand-emerald/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-emerald' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Section Actions & User */}
        <div className="flex items-center gap-3">
          {/* Active Workout Pill */}
          {activeWorkout && (
            <button
              onClick={() => setActiveTab('active-workout')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/15 border border-brand-emerald/40 text-brand-emerald font-bold text-xs animate-pulse-slow hover:bg-brand-emerald/25 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
              <span>Resume Workout</span>
            </button>
          )}

          {/* Unit Toggle Switch */}
          <button
            onClick={toggleUnitSystem}
            className="flex items-center px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs font-mono font-bold text-slate-300 border border-dark-600 transition-colors"
            title="Toggle unit system (kg / lbs)"
          >
            <span className={unitSystem === 'kg' ? 'text-brand-emerald' : 'text-slate-500'}>KG</span>
            <span className="mx-1 text-slate-600">/</span>
            <span className={unitSystem === 'lbs' ? 'text-brand-cyan' : 'text-slate-500'}>LBS</span>
          </button>

          {/* User Streak & Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600/80 transition-all"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-brand-emerald/50"
                  />
                  {(user.streak?.current || 0) > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-dark-950 font-black text-[9px] px-1 rounded-full flex items-center shadow">
                      <Flame className="w-2.5 h-2.5 fill-dark-950" />
                      {user.streak.current}
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-dark-800">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Training Profile & Re-test</span>
                    </button>
                    {!hasCompletedOnboarding && (
                      <button
                        onClick={() => {
                          setActiveTab('onboarding');
                          setProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-emerald hover:bg-brand-emerald/10 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Run Onboarding Wizard</span>
                      </button>
                    )}
                  </div>
                  <div className="pt-1 border-t border-dark-800">
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-bold text-xs shadow hover:opacity-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-lg border-t border-dark-700/80 px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-brand-emerald font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
