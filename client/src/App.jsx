import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Navbar } from './components/common/Navbar';
import { RestTimerFloating } from './components/common/RestTimerFloating';
import { AuthModal } from './components/common/AuthModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { DashboardView } from './components/dashboard/DashboardView';
import { StrengthHubView } from './components/strength/StrengthHubView';
import { ProgramPlannerView } from './components/planner/ProgramPlannerView';
import { ActiveWorkoutView } from './components/workout/ActiveWorkoutView';
import { AICoachView } from './components/coach/AICoachView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';

function AppContent() {
  const { user, profile, loading, hasCompletedOnboarding } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center shadow-2xl animate-pulse mb-4 glow-emerald">
          <span className="text-xl font-black text-dark-950">AP</span>
        </div>
        <h2 className="text-base font-bold text-white tracking-wide">ApexPulse AI</h2>
        <p className="text-xs text-slate-400 font-mono mt-1">Calibrating Adaptive Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-emerald selection:text-dark-950 pb-20 md:pb-8">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 animate-in fade-in duration-300">
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'strength' && <StrengthHubView />}
        {activeTab === 'planner' && <ProgramPlannerView onStartWorkoutNavigate={setActiveTab} />}
        {activeTab === 'active-workout' && <ActiveWorkoutView onFinishNavigate={setActiveTab} />}
        {activeTab === 'coach' && <AICoachView onNavigate={setActiveTab} />}
        {activeTab === 'leaderboard' && <LeaderboardView />}
        {activeTab === 'profile' && <ProfileView onNavigate={setActiveTab} />}
        {activeTab === 'onboarding' && (
          <OnboardingWizard onComplete={() => setActiveTab('dashboard')} />
        )}
      </main>

      {/* Floating Rest Timer */}
      <RestTimerFloating />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <AppContent />
      </WorkoutProvider>
    </AuthProvider>
  );
}
