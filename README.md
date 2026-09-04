# ApexPulse AI — Adaptive AI-Powered Fitness & Strength Benchmarking Platform

ApexPulse AI is an end-to-end full-stack MERN web application that delivers personalized resistance training by combining demographic-cohort strength benchmarking with adaptive, periodized workout planning.

---

## 🌟 Core Value Proposition & System Architecture

Unlike generic fitness templates, **ApexPulse AI**:
1. **Calibrates Where You Stand**: Tells lifters exactly where they rank relative to peers matched by age, biological sex, and body weight using empirical normative powerlifting standards.
2. **Auto-Regulates Based on Real In-Gym Data**: Dynamically calculates estimated 1RMs (Epley/Brzycki) per logged set and adjusts weekly volume/intensity using progressive overload and plateau-detection algorithms.
3. **Deterministic Safety Guardrails**: All load recommendations and injury substitutions are bounded by deterministic biomechanical rules ($\le 5\%$ single-session jumps, joint shear contraindication filters) before AI Coach suggestions are applied.

---

## 📐 Algorithmic & Mathematical Specifications

### 1. 1RM Estimation
$$\text{1RM}_{\text{Epley}} = w \cdot \left(1 + \frac{r}{30}\right)$$
$$\text{1RM}_{\text{Brzycki}} = w \cdot \left(\frac{36}{37 - r}\right)$$
- **Hybrid Blended Engine**: For $r \le 5$, uses pure Epley; for $5 < r \le 12$, averages Epley and Brzycki for balanced accuracy across rep ranges.

### 2. Age Coefficient & Masters Curve ($C_{\text{age}}$)
- **Junior Growth ($13 \le A \le 23$)**: $C_{\text{age}} = 0.85 + (A - 13) \times 0.015$
- **Peak Athletic Band ($24 \le A \le 35$)**: $C_{\text{age}} = 1.0$
- **Masters Regression ($A > 35$)**: $C_{\text{age}} = 1.0 - (A - 35) \times 0.0075$
- $\text{Age-Adjusted 1RM} = \frac{\text{1RM}}{C_{\text{age}}}$

### 3. Composite Strength Score ($0 - 1000$)
$$\text{Strength Score} = 10 \times \left( 0.25 P_{\text{squat}} + 0.25 P_{\text{deadlift}} + 0.20 P_{\text{bench}} + 0.15 P_{\text{ohp}} + 0.10 P_{\text{pull\_up}} + 0.05 P_{\text{row}} \right)$$

### 4. Progressive Overload & Fatigue Adaptation Logic
- **Overload Trigger**: Working sets completed cleanly with average $\text{RPE} \le 8.0 \rightarrow +1.25\text{kg}$ (upper) / $+2.5\text{kg}$ (lower).
- **Fatigue / Deload Trigger**: 3 consecutive sessions with average $\text{RPE} \ge 9.3$ or fatigue index $\ge 8/10 \rightarrow -40\%$ volume, $-10\%$ load active deload week.
- **Plateau Detection**: Estimated 1RM holds stagnant across 3+ consecutive sessions $\rightarrow$ suggests biomechanical variation or 3-second eccentric tempo.

---

## 🗄️ Database Schemas (Mongoose)

- `User`: Email/password authentication, preferences (kg/lbs, themes), streaks, unlocked milestone badges, and privacy flags.
- `TrainingProfile`: Demographic segmentation (age, sex, body weight, height, tier), goals, equipment access, injury contraindications, lift baselines, and composite metrics.
- `Exercise`: 28+ foundational movements with movement pattern tags, equipment requirements, injury risk areas, step-by-step form cues, and common mistakes.
- `Program`: Periodized weeks (Linear, Daily Undulating, Block), daily exercise prescriptions (%1RM, sets, reps, target RPE, rest seconds), and adaptation audit history.
- `WorkoutLog`: In-gym session logs with sets, weights, reps, RPE, live e1RM, rest taken, and offline synchronization UUID.
- `StrengthStandard`: Calibrated normative tables across bodyweight classes and biological sex with source citations.
- `LeaderboardEntry`: Scoped demographic cohort rankings with opt-in and name anonymization controls.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ and npm installed
- Local MongoDB or automated in-memory MongoDB fallback

### 1. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Run Database Seeder
Populates 28 exercises, 10 strength standard tables, demo athlete Alex Vance, and cohort leaderboard entries:
```bash
cd server
npm run seed
```

### 3. Start Development Servers
In Terminal 1 (Backend API on `http://localhost:5000`):
```bash
cd server
npm run dev
```

In Terminal 2 (Frontend Client on `http://localhost:5173`):
```bash
cd client
npm run dev
```

### 4. Run Automated Formula Tests
```bash
cd server
npm test
```

---

## 🛡️ Safety & Regulatory Disclaimers
1. **Non-Medical Framing**: ApexPulse AI provides general athletic conditioning and statistical benchmarking. It does not offer clinical diagnosis or physical therapy prescriptions.
2. **Normative Standard Limitations**: Baseline standards are calibrated against published empirical powerlifting data (ExRx, Dr. Lon Kilgore & Mark Rippetoe normative tables, and IPF masters age regressions).
