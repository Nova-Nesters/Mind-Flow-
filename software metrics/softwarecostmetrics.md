# MindFlow: Software Cost Metrics

This document explains how the MindFlow React application implements software cost metrics concepts.

---

## Table of Contents

1. [Cost Model Structure](#1-cost-model-structure)
2. [Primary Cost Factor](#2-primary-cost-factor)
3. [Cost Drivers and Effort Adjustment Factor](#3-cost-drivers-and-effort-adjustment-factor)
4. [Cost Driver Rating Scale](#5-cost-driver-rating-scale)
5. [Productivity Index](#6-productivity-index)
6. [Schedule Constraint on Effort](#7-schedule-constraint-on-effort)

---

## 1. Cost Model Structure

Software cost models compute effort as a mathematical function of a primary size factor adjusted by secondary cost drivers. The general COCOMO form is:

```
E = a × S^b × EAF
```

MindFlow implements this exact structure in `computeHealthScore()`:

```js
function computeHealthScore({ streakDays, vibeCheckIns, avgVibeScore, loginCount }) {
  const normStreak   = Math.min(streakDays    / 30, 1) * 100;
  const normVibe     = ((avgVibeScore - 1) / 4) * 100;
  const normLogins   = Math.min(loginCount    / 60, 1) * 100;
  const normCheckins = Math.min(vibeCheckIns  / 30, 1) * 100;

  const score = +(
    normStreak   * 0.40 +
    normVibe     * 0.35 +
    normLogins   * 0.15 +
    normCheckins * 0.10
  ).toFixed(1);
}
```

Each raw input is first normalised to a common `[0, 100]` range, equivalent to converting different size measures (LOC, FP, object points) to a common unit before applying a cost model. The weighted sum then mirrors how COCOMO multiplies a base effort estimate by a series of cost driver multipliers to produce a final effort figure.

---

## 2. Primary Cost Factor

In COCOMO, effort is primarily driven by system size (LOC or Function Points). Every other factor adjusts that baseline estimate. MindFlow applies the same principle — streak days is the primary cost factor, carrying the highest weight (40%) in the formula:

```js
const normStreak = Math.min(streakDays / 30, 1) * 100;
// weight: 0.40 — primary cost factor, same role as LOC in COCOMO
```

Streak days is chosen as the primary factor because, like LOC, it is a direct count measurement with a true zero and it has the strongest correlation with the output being predicted (overall engagement health). The remaining three inputs play the role of secondary adjustment factors, exactly as COCOMO's 15 cost drivers adjust the primary LOC-based estimate.

---

## 3. Cost Drivers and Effort Adjustment Factor

COCOMO Intermediate uses 15 cost drivers grouped into four categories, product, platform, personnel, and project, each rated on an ordinal scale to produce a combined Effort Adjustment Factor (EAF):

```
EAF = EM₁ × EM₂ × ... × EM₁₅
```

MindFlow implements the same two-layer structure. The three secondary inputs each act as a cost driver that adjusts the primary streak-based estimate:

| COCOMO Cost Driver Category | MindFlow Equivalent | Weight | Role |
|---|---|---|---|
| Product (e.g. RELY, CPLX) | Average vibe score | 35% | Quality of the primary output |
| Personnel (e.g. ACAP, PCAP) | Login count | 15% | Frequency and consistency of engagement |
| Project (e.g. TOOL, SCED) | Check-ins completed | 10% | Process adherence and breadth |

Where COCOMO multiplies effort multipliers together, MindFlow sums weighted normalised values, both approaches combine individual driver ratings into a single adjustment that modifies the primary estimate. The weights `(0.40, 0.35, 0.15, 0.10)` function identically to COCOMO's effort multipliers: a high vibe score increases the health score (equivalent to a low effort multiplier for a high-capability team), while low engagement on logins or check-ins reduces it.

---

## 4. Cost Driver Rating Scale

COCOMO rates each cost driver on a 6-point ordinal scale from Very Low to Extra High. Based on the rating, an effort multiplier (EM) is looked up from a table. For example, the RELY (Required Software Reliability) driver:

| Very Low | Low | Nominal | High | Very High | Extra High |
|---|---|---|---|---|---|
| 0.75 | 0.88 | 1.00 | 1.15 | 1.39 | — |

MindFlow implements the same concept through the vibe scale, which rates user mental state on a 5-point ordinal scale:

```js
const VIBE_SCALE = [
  { value: 1, label: "Terrible" },
  { value: 2, label: "Down"     },
  { value: 3, label: "Neutral"  },   // nominal baseline, like COCOMO's 1.00
  { value: 4, label: "Good"     },
  { value: 5, label: "Great"    },
];
```

Value 3 (Neutral) functions as the nominal baseline equivalent to a COCOMO effort multiplier of 1.00. Scores above 3 increase the health output (equivalent to an EM below 1.00 for a high-capability driver), and scores below 3 reduce it (equivalent to an EM above 1.00 for a high-risk driver). The average vibe score feeds directly into the health score formula as a cost driver input:

```js
const normVibe = ((avgVibeScore - 1) / 4) * 100;  // normalised cost driver value
```

---

## 5. Productivity Index

SLIM (Software Lifecycle Management), Putnam's constraint model, introduces a **Productivity Index (PI)**  a macro-level rating of the overall development environment that combines the effect of tools, methods, team skill, and application complexity into a single parameter `C` in the software equation:

```
size = C × B^(1/3) × T^(4/3)
```

PI values range from 1 (poor environment, complex system) to 40+ (excellent environment, well understood project). Higher PI = lower effort for the same size.

MindFlow implements the same concept through its engagement tier system:

```js
const ENGAGEMENT_TIERS = [
  { label: "Low",       min: 0,  max: 25  },
  { label: "Moderate",  min: 26, max: 50  },
  { label: "High",      min: 51, max: 75  },
  { label: "Excellent", min: 76, max: 100 },
];

const tier = ENGAGEMENT_TIERS.find(t => score >= t.min && score <= t.max);
```

Like SLIM's PI, the engagement tier is:
- Derived from a composite of multiple direct measurements
- Expressed as an ordinal classification (Low / Moderate / High / Excellent mirrors PI's low-to-high spectrum)
- Used to communicate overall productivity environment quality at a glance
- A macro-level summary that abstracts away the individual driver details

A user in the "Excellent" tier is the equivalent of a SLIM project with a high PI: many factors are working in their favour and the implied cost of maintaining health is low.

---

## 6. Schedule Constraint on Effort

Putnam's SLIM model demonstrates that effort and schedule are non-linearly related  compressing development time disproportionately increases effort:

```
B = (1/T)^3 × (size/C)^3    →    E ∝ T^(-4)
```

Reducing delivery time by 50% increases effort approximately 16 times. This is because productivity is constrained by time, not just by size.

MindFlow captures this constraint through the streak system. Streak days cannot be artificially inflated  they are time-ordered and must be earned on consecutive calendar days:

```js
streak: {
  currentStreak:   7,
  longestStreak:   14,
  totalActiveDays: 28,
}
```

A user cannot bulk-submit 30 check-ins in one day to claim a 30-day streak. The time dimension constrains the measurement in the same way Putnam's model constrains effort by `T`. This makes streak days the closest analogue in MindFlow to the `T` (development time) variable in the SLIM software equation: it is a hard constraint that interacts non-linearly with the overall health score output.

The normalisation of streak days in the health score formula also reflects the non-linear diminishing returns described in SLIM:

```js
const normStreak = Math.min(streakDays / 30, 1) * 100;
```

Marginal contribution decreases as the cap is approached the first 7 days contribute more proportionally than days 25–30, mirroring how early schedule compression in SLIM has a larger penalty effect than later compression.

---

## Summary

| Software Cost Metric Concept | MindFlow Implementation |
|---|---|
| Cost model formula `E = a × S^b × EAF` | `computeHealthScore()` weighted sum |
| Primary cost factor (LOC / FP) | Streak days — 40% weight |
| Cost drivers (product, personnel, project) | Vibe score, login count, check-ins — 35/15/10% weights |
| Effort Adjustment Factor (EAF) | Combined weighted normalised inputs |
| Cost driver rating scale (Very Low → Extra High) | Vibe scale 1–5 with Neutral as nominal baseline |
| Effort multiplier (EM) at nominal = 1.00 | Vibe value 3 = neutral baseline in normalisation |
| Productivity Index (SLIM) | Engagement tier (Low / Moderate / High / Excellent) |
| Schedule constraint on effort (SLIM) | Time-ordered streak: cannot be artificially inflated |
| Non-linear effort–schedule relationship | Diminishing returns in `Math.min(streakDays / 30, 1)` |
