# 🧠 mindflow

**Student Mental Health · Measurement Theory App**

A React-based dashboard for tracking student mental wellbeing, grounded in formal measurement theory. Every metric in mindflow is explicitly typed to its measurement scale — Nominal, Ordinal, Interval, Ratio, or Absolute — ensuring that only statistically valid operations are performed on each data type.

---

## ✨ Features

### 📊 Dashboard
Real-time overview of all wellness metrics with scale types displayed inline:

- **Current Streak** — Ratio scale. True zero exists; multiplicative comparisons are valid (14 days = 2× 7 days).
- **Total Logins** — Absolute scale. Direct count with no arbitrary unit.
- **Journals Completed** — Absolute scale. Each check-in increments by exactly 1.
- **7-Day Mood Sparkline** — Ordinal scale. Order is preserved; numeric distances are not meaningful.
- **Resource View Counts** — Ratio scale. True zero; arithmetic fully valid.

### 😊 Daily Vibe Check-In (`/vibe`)
Log your emotional state using a formal empirical-to-numeric mapping:

| Emoji | Label    | φ(mood) | Scale   |
|-------|----------|---------|---------|
| 😢    | Terrible | 1       | Ordinal |
| 😞    | Down     | 2       | Ordinal |
| 😐    | Neutral  | 3       | Ordinal |
| 🙂    | Good     | 4       | Ordinal |
| 😄    | Great    | 5       | Ordinal |

Each submission runs a **homomorphism validation** — verifying that the label-to-value mapping is consistent with the formal relational system before saving.

### 💬 Support Circle Forum (`/forum`)
Anonymous peer-support posts categorized by topic using a **Nominal scale**:

`Anxiety` · `Depression` · `Stress` · `Burnout` · `Study Tips` · `Relationships` · `General Wellness`

Categories carry no inherent ordering — "Anxiety" is not greater or lesser than "Stress"; they are simply distinct classes.

### 📈 Health Score (`/scores`)
An **indirect composite measurement** derived from four direct inputs:

```
Health Score = (0.40 × streak) + (0.35 × avg vibe) + (0.15 × logins) + (0.10 × check-ins)
```

All inputs are normalized to [0, 100] before combination. The result is an **Interval scale** — zero does not mean "no health"; it is an arbitrary lower bound.

Scores map to engagement tiers (Ordinal):

| Tier      | Range    |
|-----------|----------|
| Low       | 0 – 25   |
| Moderate  | 26 – 50  |
| High      | 51 – 75  |
| Excellent | 76 – 100 |

---

## 🗂️ Measurement Theory Reference

| Scale    | Where Used                          | Valid Operations                          |
|----------|-------------------------------------|-------------------------------------------|
| Nominal  | Support Circle categories           | Equality / inequality only                |
| Ordinal  | Daily Vibe (1–5), Engagement Tiers  | Order comparisons (`<`, `>`)              |
| Interval | Health Score composite              | Addition, subtraction; ratios invalid     |
| Ratio    | Streak days, resource view counts   | All arithmetic including × and ÷          |
| Absolute | Login count, journal count          | All arithmetic; unique natural unit       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-org/mindflow.git
cd mindflow
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
src/
├── App.jsx                   # Main application component
│   ├── VIBE_SCALE            # Ordinal mood scale definition
│   ├── SUPPORT_CATEGORIES    # Nominal category list
│   ├── ENGAGEMENT_TIERS      # Ordinal tier thresholds
│   ├── validateCheckIn()     # Homomorphism validator
│   └── computeHealthScore()  # Indirect measurement formula
├── components/
│   ├── MoodSparkline         # 7-day SVG mood chart
│   └── CircularScore         # Animated circular progress ring
```

---

## 🧪 Validation Logic

The `validateCheckIn` function enforces formal measurement consistency:

```js
validateCheckIn({ moodValue: 4, moodLabel: "Good" })
// → { valid: true, error: null }

validateCheckIn({ moodValue: 3, moodLabel: "Great" })
// → { valid: false, error: 'Homomorphism violation: "Great" should map to 5, got 3' }
```

This ensures the empirical relational system (emotional states) and the formal numeric system (1–5) remain consistent, preserving the integrity of all downstream analyses.

---

## 🛠️ Tech Stack

- **React** (hooks-based, no external state library)
- **Inline styles** (no CSS framework dependency)
- **SVG** for sparklines and circular progress indicators
- **Vanilla JS** for measurement calculations

---

## 📄 License

MIT License. See `LICENSE` for details.

---

## 🤝 Contributing

Pull requests are welcome. When adding new metrics, please document:
1. The **scale type** (Nominal / Ordinal / Interval / Ratio / Absolute)
2. Whether it is **direct** or **indirect** measurement
3. Which **arithmetic operations** are valid on the metric

This keeps mindflow's measurement-theoretic foundation intact.
