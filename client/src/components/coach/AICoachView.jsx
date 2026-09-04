import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatWithCoachApi, swapProgramExerciseApi, applyAdaptationApi } from '../../services/api';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Dumbbell,
  RefreshCw,
  Zap,
  Check,
  User,
} from 'lucide-react';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const AICoachView = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${user?.name?.split(' ')[0] || 'Athlete'}! I am your ApexPulse AI Training Coach. I have your **${profile?.goals?.primary || 'strength'}** program and demographic baseline loaded (Strength Score: **${profile?.compositeMetrics?.strengthScore || 675}**).\n\nHow can I optimize your session today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'I have mild shoulder tightness today',
    'Swap Barbell Bench Press with dumbbell alternative',
    'My Squat has stalled — how do I break this plateau?',
    'What are my daily protein and hydration targets?',
    'Short on time today — condense to 30 minutes',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }));
      const { data } = await chatWithCoachApi(text.trim(), historyPayload);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply,
        actions: data.actions || [],
        disclaimer: data.disclaimer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I'm having trouble connecting to the adaptive engine right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action) => {
    try {
      if (action.type === 'APPLY_DELOAD') {
        await applyAdaptationApi(action.payload);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: '✓ Active recovery deload protocol applied to your current training week.',
            timestamp: new Date(),
          },
        ]);
      } else if (action.type === 'NAVIGATE') {
        onNavigate(action.target.replace('/', ''));
      }
    } catch (e) {
      console.error('Action failed:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs font-mono font-bold uppercase flex items-center gap-1.5 border border-brand-cyan/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Context-Aware Intelligence</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">AI Coach & Biomechanical Assistant</h1>
          <p className="text-xs text-slate-400 mt-1">
            References your actual workout logs, 1RM percentiles, and injury flags to provide bounded, safe adaptations.
          </p>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Window (8 cols) */}
        <div className="lg:col-span-8 glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[640px] justify-between">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-dark-950 font-bold" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-brand-emerald text-dark-950 font-semibold shadow-md ml-auto'
                      : 'bg-dark-850 border border-dark-750 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-invert prose-xs">
                    {msg.text}
                  </div>

                  {/* Action Buttons if any */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleExecuteAction(act)}
                          className="px-3 py-1.5 rounded-xl bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.disclaimer && (
                    <p className="text-[10px] text-slate-400 border-t border-dark-750 pt-2 italic">
                      {msg.disclaimer}
                    </p>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-brand-emerald" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-dark-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-cyan animate-pulse" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-dark-850 text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                  <span>Analyzing biomechanical profile...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="py-2.5 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 text-[11px] font-medium shrink-0 transition-colors hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-dark-800"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your coach anything (e.g. form adjustments, deloads, substitutions)..."
              className="flex-1 px-4 py-3 bg-dark-850 border border-dark-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-dark-950 font-bold disabled:opacity-30 hover:opacity-95 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Live Context & Safety Guardrails Side Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel bg-dark-900 border border-dark-750 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-emerald" />
              <span>Deterministic Guardrails Active</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-dark-850 border border-dark-700">
                <span className="text-brand-emerald font-bold block mb-0.5">Load Bounding</span>
                <p className="text-slate-400 text-[11px]">
                  Engine limits single-session weight progression strictly to $\le 5\%$ to protect connective tissue.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-dark-850 border border-dark-700">
                <span className="text-brand-cyan font-bold block mb-0.5">Injury Contraindication</span>
                <p className="text-slate-400 text-[11px]">
                  Active Flags: <strong className="text-rose-400">{profile?.healthFlags?.injuries?.join(', ') || 'None'}</strong>. Exercises with high shear on flagged joints are blocked.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-dark-850 border border-dark-700">
                <span className="text-amber-400 font-bold block mb-0.5">Non-Prescriptive Wellness</span>
                <p className="text-slate-400 text-[11px]">
                  Nutrition guidance frames evidence-based macronutrient ranges without medical/diet claims.
                </p>
              </div>
            </div>
          </div>

          <DisclaimerBanner type="medical" />
        </div>
      </div>
    </div>
  );
};
