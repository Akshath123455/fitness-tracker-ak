import TrainingProfile from '../models/TrainingProfile.js';
import Program from '../models/Program.js';
import WorkoutLog from '../models/WorkoutLog.js';
import Exercise from '../models/Exercise.js';
import { findSmartSubstitutes } from './exerciseSubstitutionEngine.js';

/**
 * AI Coach Service with Gemini Integration & Strict Deterministic Guardrails
 */
export const queryAICoach = async (userId, userMessage, conversationHistory = []) => {
  // 1. Gather rich user context
  const [profile, activeProgram, recentLogs] = await Promise.all([
    TrainingProfile.findOne({ userId }).lean(),
    Program.findOne({ userId, isActive: true }).lean(),
    WorkoutLog.find({ userId, status: 'completed' }).sort({ date: -1 }).limit(5).lean(),
  ]);

  if (!profile) {
    return {
      reply: "Please complete your onboarding Training Profile first so I can provide personalized, biomechanically safe guidance.",
      actions: [{ type: 'NAVIGATE', target: '/onboarding', label: 'Complete Onboarding' }],
      disclaimer: "Non-medical fitness advisory only.",
    };
  }

  // 2. Build Structured Context
  const contextSummary = {
    demographics: {
      age: profile.demographics.age,
      sex: profile.demographics.sex,
      bodyWeightKg: profile.demographics.bodyWeightKg,
      experience: profile.demographics.experienceLevel,
    },
    goal: profile.goals.primary,
    equipment: profile.equipment.access,
    injuries: profile.healthFlags?.injuries || [],
    specialPopulation: profile.healthFlags?.specialPopulation || 'general',
    strengthScore: profile.compositeMetrics?.strengthScore || 0,
    activeProgramTitle: activeProgram?.title || 'None active',
    recentWorkoutsCount: recentLogs.length,
    recentPRs: recentLogs.flatMap((l) => l.summary?.prsAchieved || []).slice(0, 3),
  };

  const normalizedMsg = userMessage.toLowerCase();
  let isMedicalConcern =
    normalizedMsg.includes('pain') ||
    normalizedMsg.includes('hurt') ||
    normalizedMsg.includes('injury') ||
    normalizedMsg.includes('tweak') ||
    normalizedMsg.includes('sprain');

  let coachResponse = '';
  let actions = [];

  // Try live Gemini API first if API key is present
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim() !== '') {
    try {
      const systemInstruction = `You are ApexPulse AI, an elite, evidence-based strength and conditioning coach with deep biomechanics expertise.
User Context:
- Demographics: ${contextSummary.demographics.age}yo ${contextSummary.demographics.sex}, ${contextSummary.demographics.bodyWeightKg}kg, ${contextSummary.demographics.experience} level.
- Primary Goal: ${contextSummary.goal}.
- Equipment: ${contextSummary.equipment}.
- Flagged Joint Injuries: ${contextSummary.injuries.join(', ') || 'None'}.
- Special Population: ${contextSummary.specialPopulation}.
- Composite Strength Score: ${contextSummary.strengthScore}/1000.
- Active Program: ${contextSummary.activeProgramTitle}.

CRITICAL GUARDRAILS & RULES:
1. SAFETY LOAD BOUND: Never recommend weight increases greater than +5% in a single session.
2. INJURIES: If user mentions pain/injury in flagged areas (${contextSummary.injuries.join(', ')}), strictly advise safe substitute movements that minimize joint shear and explicitly state a non-medical disclaimer.
3. NUTRITION: Frame all dietary recommendations around general macronutrient wellness (e.g. 1.6-2.2g/kg protein) without prescriptive medical diet claims.
4. Keep answers concise, actionable, and formatted in clean markdown bullet points.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 600,
            },
          }),
        }
      );

      if (response.ok) {
        const resData = await response.json();
        const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          coachResponse = generatedText;
        }
      }
    } catch (apiErr) {
      console.warn('[AICoach] Gemini API call failed, falling back to deterministic engine:', apiErr.message);
    }
  }

  // Fallback to Built-in Contextual Deterministic Engine
  if (!coachResponse) {
    if (normalizedMsg.includes('swap') || normalizedMsg.includes('substitute') || normalizedMsg.includes('alternative')) {
      const allExercises = await Exercise.find().lean();
      const mentionedEx = allExercises.find(
        (e) => normalizedMsg.includes(e.name.toLowerCase()) || normalizedMsg.includes(e.slug.replace(/_/g, ' '))
      );

      if (mentionedEx) {
        const substitutes = await findSmartSubstitutes(mentionedEx, profile);
        coachResponse = `Based on your **${profile.equipment.access.replace('_', ' ')}** setup and injury profile (Flags: ${profile.healthFlags.injuries.join(', ') || 'None'}), here are the best biomechanical replacements for **${mentionedEx.name}**:\n\n` +
          substitutes
            .slice(0, 3)
            .map((s, idx) => `${idx + 1}. **${s.name}** (${s.equipmentRequired}) — Matches the ${s.movementPattern.replace('_', ' ')} movement pattern while minimizing joint shear.`)
            .join('\n\n') +
          `\n\nWould you like me to swap this into your active program?`;

        actions = substitutes.slice(0, 3).map((s) => ({
          type: 'SWAP_EXERCISE',
          label: `Swap with ${s.name}`,
          exerciseId: s._id,
          exerciseName: s.name,
        }));
      } else {
        coachResponse = `I can help you swap any exercise in your routine. Which movement are you looking to replace? (e.g. "Swap Barbell Squat", "Alternative to Bench Press")`;
      }
    } else if (normalizedMsg.includes('deload') || normalizedMsg.includes('exhausted') || normalizedMsg.includes('tired')) {
      coachResponse = `Listening to systemic fatigue signals is key to long-term strength adaptation. In your **${profile.demographics.experienceLevel}** stage, an active recovery deload reduces fatigue debt by ~40% while preserving motor unit recruitment.\n\n` +
        `**Deload Protocol for your next 7 days:**\n` +
        `- Reduce total working sets by 40% (e.g., 4 sets -> 2-3 sets)\n` +
        `- Keep intensity at 65-70% 1RM (RPE 6-7)\n` +
        `- Prioritize 8+ hours of sleep and high hydration.`;

      actions = [
        {
          type: 'APPLY_DELOAD',
          label: 'Activate 1-Week Deload Now',
          payload: { action: 'TRIGGER_DELOAD' },
        },
      ];
    } else if (normalizedMsg.includes('plateau') || normalizedMsg.includes('stuck') || normalizedMsg.includes('stalled')) {
      coachResponse = `Breaking strength plateaus requires varying stimulus vectors without abandoning foundational movement mechanics.\n\n` +
        `For your **${profile.goals.primary}** goal at **${profile.demographics.bodyWeightKg}kg** body weight (Current Strength Score: **${profile.compositeMetrics?.strengthScore}**):\n\n` +
        `1. **Micro-Periodization**: Shift from straight sets to a Daily Undulating (DUP) wave (Hypertrophy @ RPE 7.5 -> Strength @ RPE 8.5).\n` +
        `2. **Eccentric Tempo**: Add a 3-second lowering phase to increase mechanical tension without excessive spinal loading.\n` +
        `3. **Accessory Weak-Point Target**: Bolster primary stabilizers (e.g., Face pulls for bench stability, Bulgarian split squats for squat drive).`;

      actions = [
        {
          type: 'REGENERATE_PROGRAM',
          label: 'Switch to DUP Wave Periodization',
          payload: { periodizationPreference: 'undulating' },
        },
      ];
    } else if (normalizedMsg.includes('nutrition') || normalizedMsg.includes('protein') || normalizedMsg.includes('calories') || normalizedMsg.includes('diet')) {
      const bw = profile.demographics.bodyWeightKg;
      const proteinLow = Math.round(bw * 1.6);
      const proteinHigh = Math.round(bw * 2.2);

      coachResponse = `Here are general evidence-based nutritional guidelines for your **${profile.goals.primary}** training focus (Non-medical general wellness framing):\n\n` +
        `- **Protein Intake**: ~${proteinLow}g – ${proteinHigh}g per day (1.6 to 2.2g per kg of body weight) distributed across 3-4 meals to maximize Muscle Protein Synthesis (MPS).\n` +
        `- **Pre-Workout Fuel**: Consume complex carbohydrates (30-50g) and moderate protein 1.5-2 hours before training.\n` +
        `- **Hydration**: Aim for 35-45ml of water per kg body weight (~${(bw * 0.04).toFixed(1)}L/day), especially around heavy lifting sessions.`;
    } else {
      coachResponse = `Hey! I'm your ApexPulse AI Coach. I'm actively analyzing your **${profile.goals.primary}** trajectory (${contextSummary.activeProgramTitle}, Strength Score: **${contextSummary.strengthScore}**).\n\n` +
        `You can ask me to:\n` +
        `- Swap any exercise in today's workout due to equipment or injury constraints\n` +
        `- Review step-by-step form cues for any major compound lift\n` +
        `- Evaluate whether you should increase weight or trigger a deload\n` +
        `- Adjust your weekly schedule or periodization model`;
    }
  }

  // Safety Prepend for Medical Concerns
  let finalDisclaimer = "ApexPulse AI provides general athletic conditioning and training analytics. Always consult a licensed healthcare professional for medical conditions, rehabilitation, or diagnosis.";
  if (isMedicalConcern && !coachResponse.includes('Safety & Medical Notice')) {
    coachResponse = `> ⚠️ **Safety & Medical Notice**: If you are experiencing acute, sharp, or radiating joint/back pain, please stop the movement immediately and consult a qualified physical therapist or physician.\n\n` + coachResponse;
  }

  return {
    reply: coachResponse,
    contextSummary,
    actions,
    disclaimer: finalDisclaimer,
  };
};
