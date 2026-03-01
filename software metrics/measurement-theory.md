# Mind Flow — Mental Health Support Platform

**Mind Flow** is a mental health support platform designed for students, developed through the lens of **Software Measurement Theory**. The application treats software attributes not merely as data points, but as a mapping from an *Empirical Relational System* (student well-being and engagement) to a *Formal Relational System* (numerical metrics).

By identifying specific **Entities** (users, posts, sessions) and their **Attributes** (mood, persistence, category), Mind Flow implements a multi-tiered measurement framework utilizing all five major scale types  **Nominal, Ordinal, Interval, Ratio, and Absolute**  to ensure data collected is both mathematically valid and practically meaningful for tracking mental health trends.

---

## Measurement Framework

### Scale Constants

| Module / Component | Metric | Scale Type | Values / Range |
|---|---|---|---|
| `VIBE_SCALE` (Mood Check-in) | User mood rating | Ordinal | 1 (Terrible) – 5 (Great) |
| `SUPPORT_CATEGORIES` (Forum Categories) | Support topic classification | Nominal | Anxiety, Depression, Stress, Burnout, Study Tips, Relationships, General Wellness |
| `ENGAGEMENT_TIERS` (Health Score Tier) | User engagement level | Ordinal | Low (0–25), Moderate (26–50), High (51–75), Excellent (76–100) |

### Computed Metrics

| Module / Component | Metric | Scale Type | Values / Range |
|---|---|---|---|
| Compute Health Score | Overall health/engagement score (indirect) | Interval | 0–100 (normalized percentage) |
| Avg Vibe (computed) | Average mood score | Interval (derived from ordinal) | 1.0–5.0 (e.g., 3.7) |

### User Activity Metrics

| Module / Component | Metric | Scale Type | Values / Range |
|---|---|---|---|
| `streak` (current streak) | Consecutive active days | Ratio | 0 to ∞ (initial: 7) |
| `streak` (longest streak) | Longest consecutive active days | Ratio | 0 to ∞ (initial: 14) |
| `streak` (total active days) | Total active days | Ratio | 0 to ∞ (initial: 28) |
| `logins` | Total login sessions | Absolute | 0 to ∞ (initial: 23) |
| Journals Completed | Completed journal entries | Absolute | 0 to ∞ (initial: 18) |
| Check-In History | 7-day mood history | Ordinal | Array of 1–5 values (e.g., [4, 3, 5, 2, 4, 5, 3]) |

### Resource / Forum Metrics

| Module / Component | Metric | Scale Type | Values / Range |
|---|---|---|---|
| Resource Views | Views per resource category | Ratio | Positive integers per category (e.g., Anxiety: 12) |

---

## Key Entities

- **Users** — Students interacting with the platform
- **Posts** — Forum contributions categorized by support topic
- **Sessions** — Login and engagement sessions tracked over time

---

## Scale Type Summary

| Scale | Used For |
|---|---|
| **Nominal** | Categorical labels with no inherent order (e.g., support categories) |
| **Ordinal** | Ranked values where order matters but intervals are not equal (e.g., mood ratings, engagement tiers) |
| **Interval** | Numeric scores with meaningful differences but no true zero (e.g., health score, avg vibe) |
| **Ratio** | Counts with a true zero and meaningful ratios (e.g., streaks, resource views) |
| **Absolute** | Exact discrete counts with no ambiguity (e.g., logins, journal entries) |
