import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, Sparkles, Dumbbell } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, register, loadDemo } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loadDemo();
      onClose();
    } catch (err) {
      setError('Could not load demo profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-md bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-dark-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-dark-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'login' ? 'Sign In to ApexPulse' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-400">Personalized adaptive strength benchmarking</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Vance"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="athlete@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-bold text-sm shadow hover:opacity-95 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Get Started'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-900 px-2 text-slate-500 font-semibold">Or Instant Access</span>
          </div>
        </div>

        {/* 1-Click Demo Button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-brand-cyan/40 text-brand-cyan font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Pre-configured Demo Athlete</span>
        </button>

        {/* Toggle Mode */}
        <p className="text-center text-xs text-slate-400 mt-4">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-brand-emerald font-bold hover:underline ml-1"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};
