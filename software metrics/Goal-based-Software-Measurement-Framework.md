# Mindflow — Goal-Based Software Measurement Framework

---

## 1. Goal-Based Measurement (GBM) — The Core Principle

> *"The primary question in goal-based measurement: 'What do we want to know or learn?'
> instead of 'What metrics should we use?' Because the answers depend on your goals,
> no fixed set of metrics is universally appropriate."*

mindflow was built around this principle. The metrics were not chosen first — the goal
was defined first, and metrics were derived from it. The app's primary question was:

**"What do we want to know about a student's mental wellbeing engagement?"**

That question drove every data element in the app, not the reverse.

---

## 2. GBM Process — Determining What and How to Measure

> *"Determining what to measure: Identifying entities → Classifying entries →
> Determining relevant goals. Determining how to measure: Inquire about metrics →
> Assign metrics."*

| GBM Stage | mindflow Implementation |
|---|---|
| Identifying entities | Student (agent), check-in (activity), forum post (artifact), health score (product) |
| Classifying entries | Student = resource; check-in process = process; health score = product |
| Determining relevant goals | Improve student wellbeing through measurable daily engagement habits |
| Inquire about metrics | Which student behaviours are observable and signal engagement? |
| Assign metrics | Streak → Ratio; Vibe → Ordinal; Logins → Absolute; Health Score → Interval |

---

## 3. Identifying Entities — Process, Product, Resource

> *"Process: a collection of software-related activities usually associated with some
> timescale. Product: any artifacts or deliverables that result from a process activity.
> Resource: entities required by a process activity."*

| Category | mindflow Entity |
|---|---|
| **Process** | Daily Vibe Check-In (a repeatable daily activity with a defined timescale) |
| **Process** | Forum post submission (an activity that produces an artifact) |
| **Process** | Resource browsing (an activity with measurable throughput — view counts) |
| **Product** | Forum post (artifact produced by the submission process) |
| **Product** | Health Score (deliverable derived by `computeHealthScore()`) |
| **Product** | Engagement Tier label (classification output — Low/Moderate/High/Excellent) |
| **Resource** | Student / user (the agent required by all process activities) |
| **Resource** | Streak days (a resource attribute — days of consecutive availability) |

---

## 4. Types of Attributes — Internal and External

> *"Internal attributes: measured entirely in terms of the process, product, or resource
> itself — e.g., size. External attributes: measured with respect to how the entity
> relates to its environment through its behaviour — e.g., quality."*

| Type | mindflow Attribute | Why |
|---|---|---|
| **Internal** | Streak days | Measured from the student's own activity log alone — no external reference |
| **Internal** | Login count | Counted from authentication events — fully self-contained |
| **Internal** | Vibe score (φ ∈ 1–5) | Derived from the student's own ordinal input |
| **Internal** | Check-in count | Counted from submission events only |
| **External** | Health Score (44.8/100) | Meaningful only relative to population-estimated ceilings (30 days streak, 60 logins) that define "good" in context |
| **External** | Engagement Tier | Meaningful only relative to the tier thresholds — its quality depends on how the student relates to the defined population norms |

---

## 5. GQM — Goal, Question, Metric

> *"Goal: List major goals. Question: Derive from each goal the questions that must be
> answered to determine if the goals are being met. Metrics: Decide what must be
> measured in order to answer the questions adequately."*

### mindflow's Complete GQM Tree

```
GOAL
└── Improve student mental wellbeing through measurable daily engagement habits
    │
    ├── QUESTION 1: Is the student consistently showing up?
    │   └── METRIC: Streak days — Ratio scale, consecutive active days, true zero
    │
    ├── QUESTION 2: How has the student's mood trended over the last week?
    │   └── METRIC: 7-day check-in history + sparkline — Ordinal, φ ∈ {1–5}
    │
    ├── QUESTION 3: How frequently is the student engaging with the platform?
    │   └── METRIC: Login count — Absolute scale, total authentication events
    │
    ├── QUESTION 4: Which mental health topics is the student exploring?
    │   └── METRIC: Resource view counts per category — Ratio scale, true zero
    │
    ├── QUESTION 5: What is the student's overall engagement level?
    │   └── METRIC: Health Score — Interval scale, indirect composite [0–100]
    │
    └── QUESTION 6: Is the student participating in the peer support community?
        └── METRIC: Forum post count + category — Nominal + Absolute
```

Every metric traces back through a question to the single business goal — the
traceability the GQM model requires.

---

## 6. Basili's GQM — 5 Phases

> *"Phase 1: Develop goals. Phase 2: Generate questions that define goals in a
> quantifiable way. Phase 3: Specify metrics to answer questions. Phase 4: Develop
> data collection mechanisms. Phase 5: Collect, validate, and analyze data in real
> time for corrective action."*

| Phase | mindflow Implementation |
|---|---|
| **1 — Develop goals** | One overarching goal: improve student wellbeing engagement |
| **2 — Quantifiable questions** | 6 questions listed above — each answerable with a number or category label |
| **3 — Specify metrics** | `VIBE_SCALE`, streak counter, login counter, resource view map, `computeHealthScore()` |
| **4 — Data collection mechanisms** | `/vibe` tab (ordinal input), `/dashboard` (ratio/absolute counters), `/forum` (nominal category tagging) |
| **5 — Collect, validate, analyze in real time** | `validateCheckIn()` gates every submission; `computeHealthScore()` recalculates on every state change; tier badge updates instantly |

---

## 7. GQ(I)M — Converting a Business Goal to a Measurement Plan

> *"A methodology to convert a business goal into a measurement plan. Three precepts:
> measurement goals are derived from business goals; evolving mental models provide
> context and focus; GQ(I)M translates informal business goals into executable
> measurement structures."*

mindflow converts its informal business goal into a fully executable structure:

```
BUSINESS GOAL (informal natural language)
"Help students feel better and stay mentally healthy during their studies."
        ↓  GQ(I)M Process
MEASUREMENT PLAN (executable)
1. Streak Days     → Ratio    → min(streakDays/30, 1) × 100   → weight 0.40
2. Avg Vibe Score  → Ordinal  → ((avgVibe − 1) / 4) × 100     → weight 0.35
3. Login Count     → Absolute → min(logins/60, 1) × 100        → weight 0.15
4. Check-in Count  → Absolute → min(checkIns/30, 1) × 100      → weight 0.10
                                                                ─────────────
5. Health Score    → Interval → weighted sum [0, 100]
6. Engagement Tier → Ordinal  → Low / Moderate / High / Excellent
```

---

## 8. All 10 GQ(I)M Steps

> *"The GQ(I)M method begins with identifying business goals and breaking them down
> into manageable subgoals. It ends with a plan for implementing well-defined measures
> and indicators that support the goals. It can also maintain traceability back to
> the business goals."*

---

### Step 1 — Identify Business Goals

> *"The output of Step 1 is a sorted checklist of business goals along with their
> definitions. Template: (1) Purpose — to characterise/evaluate the process/product
> in order to understand/improve it. (2) Perspective — examine the cost/effectiveness
> from the viewpoint of the developer/manager/customer. (3) Environment — process
> factors, people factors, methods, constraints."*

**mindflow's business goal using the PDF template:**

```
Purpose:      Evaluate the student's daily engagement habits
              in order to improve their mental wellbeing.

Perspective:  Examine consistency, mood trends, and topic interest
              from the point of view of the student themselves.

Environment:  University student population; app used daily on personal
              devices; 30-day rolling activity windows; once-per-day
              mood check-in; no clinical diagnosis intended — engagement
              proxy only; mobile-first React interface.
```

---

### Step 2 — Identify What to Know

> *"Ask: 'What activities do we manage or execute?' and 'What do we want to achieve
> or improve?' The output is the entity-question checklist across four categories:
> inputs and resources, products and by-products, internal artifacts, and activities
> and flowpaths."*

**mindflow's entity-question checklist:**

| Category | Entity | Questions Asked |
|---|---|---|
| **Inputs & Resources** | Student | How often are they logging in? Are they consistently active? |
| **Inputs & Resources** | Current mood state | What is their emotional state today? Is it changing? |
| **Products & By-products** | Health Score | What is the student's overall engagement level right now? |
| **Products & By-products** | Forum post | What topics is the student seeking support on? |
| **Internal Artifacts** | Check-in history array | What is the 7-day mood trend? Is it improving or declining? |
| **Internal Artifacts** | Streak record | Has the student maintained a consistent daily habit? |
| **Activities & Flowpaths** | Vibe check-in flow | Is the student completing daily check-ins? |
| **Activities & Flowpaths** | Resource browsing | Which mental health topics are being explored and how often? |

---

### Step 3 — Identify Subgoals

> *"Grouping related questions helps identify subgoals. Groupings of issues and
> questions translate naturally into candidate subgoals."*

Questions from Step 2 were grouped into four natural clusters:

| Grouping | Questions Grouped | Derived Subgoal |
|---|---|---|
| **Group 1 — Consistency** | How often logging in? Maintaining streak? Showing up daily? | SG1: Improve daily engagement consistency |
| **Group 2 — Mood** | What is emotional state? Has it changed? 7-day trend? | SG2: Track and surface emotional wellbeing trends |
| **Group 3 — Exploration** | Which topics browsed? How often? Which resources viewed? | SG3: Encourage proactive mental health resource use |
| **Group 4 — Community** | Seeking peer support? Which issues shared in forum? | SG4: Foster peer support community participation |

Each subgoal maps directly to one tab in the app: `/dashboard`, `/vibe`, Resource Hub in
dashboard, and `/forum`.

---

### Step 4 — Identify Entities and Attributes

> *"Examine each question and identify entities implicit in it. Then list pertinent
> attributes associated with each entity. Pertinent attributes are those which, if
> quantified, help answer your question. The attributes will become candidates for
> the things that should be measured."*

| Subgoal | Entity | Pertinent Attributes |
|---|---|---|
| SG1 — Consistency | Student activity log | `currentStreak` (days), `longestStreak` (days), `totalActiveDays`, `loginCount` |
| SG2 — Mood | Student emotional state | `moodValue` (φ ∈ 1–5), `checkInHistory[]` (7 days), `avgVibeScore`, trend direction |
| SG3 — Exploration | Resource category | `viewCount` per topic, topic name (nominal label), relative interest ranking |
| SG4 — Community | Forum post | `postCategory` (nominal), submission timestamp, content, anonymity flag |
| All subgoals | Health Score product | Composite score [0–100], tier label, normalised component scores |

---

### Step 5 — Formalize Measurement Goals

> *"A measurement goal is a semi-formal representation of a business goal composed of
> 4 components: an object of interest (entity), a purpose, a perspective, and a
> description of environment and constraints."*

Using the PDF's measurement goal template for each of mindflow's four subgoals:

---

**MG1 — Daily Engagement Consistency**
```
Object of interest:  Student activity log
Purpose:             Evaluate the consistency of daily platform engagement
                     in order to improve habit formation.
Perspective:         Examine streak days and login frequency
                     from the point of view of the student.
Environment:         30-day rolling window; one active day = at least one
                     login or check-in; streak resets to 0 on a missed
                     calendar day; university academic term as timescale.
```

**MG2 — Emotional Wellbeing Trend**
```
Object of interest:  Student's daily self-reported mood
Purpose:             Characterize the emotional state trend over 7 days
                     in order to identify early signs of deterioration.
Perspective:         Examine ordinal vibe scores across check-in history
                     from the point of view of the student.
Environment:         One submission per day; 5-point ordinal scale;
                     no clinical diagnosis; student sets their own frame
                     of reference; sparkline visualises the 7-day window.
```

**MG3 — Resource Engagement**
```
Object of interest:  Mental health resource topic categories
Purpose:             Evaluate which topics the student engages with
                     in order to understand areas of interest and concern.
Perspective:         Examine view counts per topic category
                     from the point of view of the student.
Environment:         7 topic categories; one view = one resource card click;
                     ratio scale with true zero (0 views = genuinely no
                     engagement with that topic); no session-length tracking.
```

**MG4 — Community Participation**
```
Object of interest:  Forum post artifact
Purpose:             Characterize peer support participation
                     in order to assess community engagement level.
Perspective:         Examine post count and topic categories
                     from the point of view of the student community.
Environment:         Anonymous posting; nominal category tagging (no ordering
                     imposed); posts are work artifacts; no moderation scoring.
```

---

### Step 6 — Identify Quantifiable Questions and Indicators

> *"An indicator is a display of one or more measurement results designed to
> communicate or explain the significance of those results to the user. A
> quantifiable question addresses a specific entity with a numeric or logical
> answer — unlike Step 2 questions which address a generic class."*

| Step 2 Generic Question | Step 6 Quantifiable Question | mindflow Indicator |
|---|---|---|
| Is the student engaging consistently? | How many consecutive days has the student logged in this month? | Streak ring: `currentStreak / longestStreak` percentage arc |
| How is the student feeling? | What is the average vibe score across the last 7 check-ins? | 7-day SVG sparkline + `avgVibe.toFixed(1)` label |
| Is the student exploring resources? | What is the view count for each of the 7 topic categories? | Horizontal bar chart per category, sorted by count |
| What is the overall engagement level? | What is the weighted normalised composite score out of 100? | Circular progress ring with exact score, e.g. 44.8 / 100 |
| Is the student improving? | Has the engagement tier changed from last session? | Tier badge: Low / Moderate / High / Excellent |

Each indicator was designed so that *seeing how the data would be displayed clarified
exactly what had to be measured* — the principle the PDF states for this step.

---

### Step 7 — Identify Data Elements

> *"Identify data elements that must be collected to construct the indicators.
> Prepare a cross-reference checklist: which data element is used by which indicator."*

| Data Element | Scale | Used by Indicator |
|---|---|---|
| `currentStreak` | Ratio | Streak ring, Health Score (weight 0.40) |
| `longestStreak` | Ratio | Streak ring denominator (personal baseline) |
| `totalActiveDays` | Ratio | Dashboard stats card |
| `loginCount` | Absolute | Dashboard stats card, Health Score (weight 0.15) |
| `journalsCompleted` | Absolute | Dashboard stats card |
| `checkInHistory[]` | Ordinal array | 7-day sparkline, avgVibe calculation |
| `avgVibeScore` | Derived ordinal | Health Score (weight 0.35), sparkline label |
| `vibeCheckIns` | Absolute | Health Score (weight 0.10) |
| `resourceViews{}` | Ratio map | Bar chart per category |
| `forumPosts[]` | Nominal + Absolute | Forum feed, category filter |

---

### Step 8 — Define Measures

> *"Definitions must indicate: name and short description, scale, range of variation,
> precision required, implicit and explicit assumptions related to measurement, what is
> included and what is not."*

The PDF compares two height definitions — one vague, one precise — and asks which
produces more reliable, consistent, and interpretable data. mindflow applies the
precise approach to every measure:

---

**Measure: Streak Days**
```
Name:         currentStreak
Description:  Number of consecutive calendar days with at least one app interaction
Scale:        Ratio
Range:        [0, ∞) — no upper bound; normalised to ceiling of 30 for scoring
Precision:    Integer whole days only
Assumptions:  A day = midnight-to-midnight local time; streak resets to 0 if a
              full calendar day passes with no login or check-in; no distinction
              between one interaction and ten interactions on the same day.
```

**Measure: Vibe Score**
```
Name:         moodValue
Description:  Student's self-reported emotional state for the current day
Scale:        Ordinal
Range:        {1, 2, 3, 4, 5} → {Terrible, Down, Neutral, Good, Great}
Precision:    Integer; no half-values or interpolation permitted
Assumptions:  One submission per day maximum; order is empirically preserved
              (5 > 4 > 3 > 2 > 1); numeric distances are NOT meaningful —
              the gap between 1 and 2 need not equal the gap between 4 and 5
              in the real emotional world; homomorphism validated before saving.
```

**Measure: Login Count**
```
Name:         loginCount
Description:  Total authentication events since account creation
Scale:        Absolute
Range:        [0, ∞) — true zero means account has never been used
Precision:    Integer; each login = exactly +1 regardless of session length
Assumptions:  Re-authentication on the same day still increments the counter;
              no distinction is made between session depth or duration.
```

**Measure: Health Score**
```
Name:         healthScore
Description:  Weighted composite of four normalised direct measurements
Scale:        Interval — zero is arbitrary (NOT "no health"); ratios are invalid
Range:        [0, 100] — lower bound is arbitrary, not a true zero
Precision:    One decimal place (e.g., 44.8)
Formula:      score = normStreak×0.40 + normVibe×0.35
                    + normLogins×0.15 + normCheckins×0.10
              where each norm = min(raw/ceiling, 1) × 100
Assumptions:  Ceilings (30 days, 4 vibe range, 60 logins, 30 check-ins) are
              population estimates, not hard limits; a score of 0 means all
              inputs are at their minimum — not that the student is unwell;
              a score of 80 is NOT "twice as healthy" as 40 — ratio operations
              on this scale are invalid.
```

**Measure: Forum Category**
```
Name:         postCategory
Description:  Topic domain classification for a forum post
Scale:        Nominal — unordered set of 7 labels
Range:        {Anxiety, Depression, Stress, Burnout, Study Tips,
               Relationships, General Wellness}
Precision:    Exact match only; no partial categories
Assumptions:  Categories are mutually exclusive; no ordering is imposed —
              "Anxiety" is not greater than "Stress"; assignment is by the
              posting student.
```

---

### Step 9 — Identify Actions to Implement Measures

> *"Step 9.1 Analysis: What data elements are required? Which are collected now?
> How are they collected? Step 9.2 Diagnosis: How well do existing elements meet
> measurement needs? What must change? Step 9.3 Action: Translate into implementable
> steps — identify data sources, collection methods, tools, frequencies, responsible
> owners."*

**Step 9.1 — Analysis**

| Data Element | Collection Method | Collection Point |
|---|---|---|
| Streak | Calculated from last active date on app load | App initialisation |
| Login count | Incremented on auth event | Authentication handler |
| Vibe score | User selects from 5-option UI | `/vibe` tab on submit |
| Resource views | Incremented on resource card click | Resource card onClick |
| Forum posts | Form submit → appended to posts array | `/forum` tab on submit |

**Step 9.2 — Diagnosis**

| Gap Identified | Resolution Applied |
|---|---|
| Ordinal vibe scores cannot be directly averaged into a ratio formula | Normalised to [0,100] first: `((avgVibe − 1) / 4) × 100` |
| Different metrics have incompatible natural ceilings | Each normalised independently to its population ceiling before weighting |
| Nominal forum categories cannot contribute to a numeric score | Excluded from Health Score; used only for qualitative grouping in forum view |
| Health Score zero is ambiguous without context | Explicitly labelled Interval in UI: *"zero does not mean 'no health'"* |

**Step 9.3 — Action**

- Data sources identified: vibe tab (self-report), login counter (auth events), resource cards (click events)
- Collection frequency defined: vibe once per day; logins per session; resources per click; streak recalculated daily
- Validation gate: `validateCheckIn()` runs before any vibe value enters state — the data collection procedure
- Responsible functions assigned: `computeHealthScore()` owns all normalisation and weighting
- Storage and reporting: all state held in React `useState`; health score displayed live on every state change

---

### Step 10 — Prepare the Measurement Plan

> *"Measurement plan template: 10.1 Objective, 10.2 Description (background, goals,
> scope), 10.3 Implementation (activities, schedules, resources, responsibilities,
> assumptions, risks), 10.4 Sustained operations."*

**10.1 Objective**

Implement five measures — streak, vibe, logins, resource views, and health score — that
collectively answer whether a student's daily wellbeing engagement is improving, stable,
or declining. The health score provides a single actionable number the student can
track across sessions.

**10.2 Description**

*Background:* mindflow was designed to apply the GQ(I)M framework to student mental
health tracking. All metrics were derived through the 10-step process above, not
selected ad hoc.

*Goals:* (a) Business goal: improve student mental wellbeing. (b) Measurement goals:
the four MGs formalised in Step 5. (c) Plan goal: produce a valid, scale-aware composite
score with documented assumptions and live feedback.

*Scope:* Measures apply to individual students only. Results are personal — not
aggregated across a population. The health score is an engagement proxy, not a
clinical instrument.

**10.3 Implementation**

| Activity | Component Responsible | Frequency |
|---|---|---|
| Collect vibe score | `/vibe` tab + `validateCheckIn()` | Once per calendar day |
| Increment login count | Auth event handler | Per login |
| Recalculate streak | `calculateStreak()` | On each app load |
| Record resource view | Resource card onClick | Per click event |
| Compute health score | `computeHealthScore()` | On every state change |
| Display all indicators | `/scores` tab (ring, bars, tier badge) | Real-time |

*Assumptions:* Student uses app at least weekly; 30-day window represents a reasonable
university activity cycle; ordinal mood selections are honest self-reports.

*Risks:* Non-linear relationships (e.g., high streak with consistently low mood)
may produce a misleadingly moderate score. Mitigation: broad tier boundaries
(25-point bands) avoid false precision. Weights are adjustable in `computeHealthScore()`
without touching UI code.

**10.4 Sustained Operations**

- All measure definitions stored in named constants (`VIBE_SCALE`, `ENGAGEMENT_TIERS`)
  so they can be updated without breaking the formula
- `validateCheckIn()` is a pure function — independently testable and auditable
- `computeHealthScore()` is a pure function — weights can be adjusted as evidence
  accumulates, with no side effects on data collection
- Scale-type labels rendered inline on every metric card so the measurement plan
  stays visible and interpretable to the student at all times

---

## 9. Active vs. Passive Measurement Goals

> *"Active goals: directed toward controlling processes or causing changes.
> Passive goals: meant to enable learning or understanding."*

| Goal Type | mindflow Example |
|---|---|
| **Active** | Streak ring actively motivates behaviour change — the visual gap between current and longest streak creates a target to close |
| **Active** | Engagement tier badge creates a ranked goal state (Low → Moderate → High → Excellent) to work toward |
| **Passive** | 7-day sparkline enables the student to understand their mood pattern without prescribing action |
| **Passive** | Resource view bar chart identifies which topics the student gravitates toward |
| **Passive** | Health score characterises the current engagement state for self-assessment |

---

## 10. Complete GQ(I)M Traceability Map

```
BUSINESS GOAL
└── Improve student mental wellbeing engagement
    │
    ├── SUBGOAL 1: Improve daily consistency
    │   ├── MG1: Evaluate streak (Ratio) from student's perspective
    │   ├── Quantifiable Q: "How many consecutive days has the student logged in?"
    │   ├── Indicator: Streak ring (currentStreak / longestStreak %)
    │   └── Measure: currentStreak — integer, ratio, true zero, daily granularity
    │
    ├── SUBGOAL 2: Track emotional wellbeing trends
    │   ├── MG2: Characterise mood (Ordinal) from student's perspective
    │   ├── Quantifiable Q: "What is the average vibe score over the last 7 check-ins?"
    │   ├── Indicator: 7-day sparkline + avgVibe.toFixed(1) label
    │   └── Measure: moodValue — ordinal {1–5}, validated homomorphism, one per day
    │
    ├── SUBGOAL 3: Encourage resource exploration
    │   ├── MG3: Evaluate resource views (Ratio) from student's perspective
    │   ├── Quantifiable Q: "What is the view count for each topic category?"
    │   ├── Indicator: Horizontal bar chart, one bar per category
    │   └── Measure: resourceViews{} — ratio, true zero, one click = one view
    │
    └── SUBGOAL 4: Foster community participation
        ├── MG4: Characterise forum participation (Nominal) from community perspective
        ├── Quantifiable Q: "How many posts submitted and in which categories?"
        ├── Indicator: Forum feed + category filter badges
        └── Measure: postCategory — nominal, 7 unordered classes, no arithmetic

MEASUREMENT PLAN OUTPUT
└── Health Score = 0.40×normStreak + 0.35×normVibe + 0.15×normLogins + 0.10×normCheckins
    Scale:   Interval [0, 100]
    Zero:    Arbitrary (not "no health")
    Ratios:  Invalid
    Output:  Engagement Tier — Ordinal (Low / Moderate / High / Excellent)
```

---

## Getting Started

```bash
git clone https://github.com/your-org/mindflow.git
cd mindflow
npm install
npm run dev          # http://localhost:5173
npm run build        # production build
```

---

## Reference

Far, B.H. *SENG 421: Software Metrics — Goal-Based Software Measurement Framework
(Chapter 3)*. Department of Electrical & Computer Engineering, University of Calgary.

Basili, V.R. and Weiss, D. (1984). A Methodology for Collecting Valid Software
Engineering Data. *IEEE Transactions on Software Engineering*, vol. 10, pp. 728–738.

Basili, V.R. and Rombach, H.D. (1988). The TAME Project: Towards Improvement-Oriented
Software Environments. *IEEE Transactions on Software Engineering*, vol. 14, pp. 758–773.
