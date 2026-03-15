/**
 * ============================================================
 * Student Mental Health App — Backend Schema
 * Implements Measurement Theory (Chapter 2) concepts:
 *   Nominal, Ordinal, Interval, Ratio/Absolute scales
 *   Direct & Indirect measurement
 *   Empirical vs. Formal Relational Systems
 * ============================================================
 */

// ────────────────────────────────────────────────────────────
// MONGOOSE / MONGODB SCHEMA  (swap .type annotations for SQL
// column comments if using PostgreSQL — see SQL version below)
// ────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// ── 1. USER ──────────────────────────────────────────────────
/**
 * Core user document.
 * Mixes several scale types; each field is annotated.
 */
const UserSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true,
    // SCALE: Nominal — a label with no inherent numeric order
    _scale: 'Nominal',
    _measurement: 'Direct (identity)',
  },

  email: {
    type: String,
    required: true,
    unique: true,
    _scale: 'Nominal',
  },

  createdAt: {
    type: Date,
    default: Date.now,
    // SCALE: Ratio — timestamps have a meaningful zero epoch;
    // differences (durations) are meaningful
    _scale: 'Ratio',
  },

  // ── DIRECT MEASUREMENT: Absolute Scale ──────────────────
  totalLogins: {
    type: Number,
    default: 0,
    min: 0,
    // SCALE: Absolute — counting with a true zero.
    // All arithmetic (+, −, ×, ÷) is valid.
    // MEASUREMENT TYPE: Direct
    _scale: 'Absolute',
    _measurement: 'Direct',
    _note: 'Increment on every successful authentication event.',
  },

  totalJournalsCompleted: {
    type: Number,
    default: 0,
    min: 0,
    _scale: 'Absolute',
    _measurement: 'Direct',
  },

}, { timestamps: true });


// ── 2. DAILY VIBE CHECK-IN ────────────────────────────────────
/**
 * Empirical Relational System → Formal Relational System mapping:
 *
 *   Real-world emotional state (entity)   →  Numeric representation
 *   ─────────────────────────────────────────────────────────────
 *   "I feel terrible / Sad"               →  1
 *   "I feel down"                         →  2
 *   "I feel okay / Neutral"               →  3
 *   "I feel good"                         →  4
 *   "I feel great / Happy"                →  5
 *
 * The mapping preserves the EMPIRICAL ordering (Sad < Neutral < Happy)
 * in the FORMAL system (1 < 3 < 5), satisfying the ordinal requirement.
 * We do NOT claim equal spacing between feelings (that would require
 * interval/ratio justification we cannot assert for subjective mood).
 *
 * SCALE: Ordinal
 *   - Order is preserved.
 *   - Differences between values are NOT numerically meaningful.
 *   - No true zero (0 would mean "no mood", which is undefined).
 */
const VIBE_SCALE = Object.freeze({
  // { label, emoji, numericValue }
  TERRIBLE: { label: 'Terrible', emoji: '😢', value: 1 },
  DOWN:     { label: 'Down',     emoji: '😞', value: 2 },
  NEUTRAL:  { label: 'Neutral',  emoji: '😐', value: 3 },
  GOOD:     { label: 'Good',     emoji: '🙂', value: 4 },
  GREAT:    { label: 'Great',    emoji: '😄', value: 5 },
});

const VibeCheckInSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // SCALE: Ordinal (1–5 preserving Sad < Neutral < Happy)
  // MEASUREMENT TYPE: Direct
  moodValue: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    _scale: 'Ordinal',
    _measurement: 'Direct',
    _note: 'Integer 1–5 mapping emotional state; order is significant, distance is not.',
  },

  moodLabel: {
    type: String,
    enum: ['Terrible', 'Down', 'Neutral', 'Good', 'Great'],
    // SCALE: Nominal (human-readable label; the ordering comes from moodValue)
    _scale: 'Nominal',
  },

  notes: {
    type: String,
    maxlength: 500,
    _scale: 'Nominal (free text)',
  },

  recordedAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

}, { timestamps: true });


// ── 3. SUPPORT CIRCLE POST ────────────────────────────────────
/**
 * Categories use a NOMINAL scale: each is a distinct class
 * with no inherent ordering among them.
 */
const SUPPORT_CATEGORIES = Object.freeze([
  'Anxiety',
  'Depression',
  'Stress',
  'Burnout',
  'Study Tips',
  'Relationships',
  'General Wellness',
]);

const SupportPostSchema = new mongoose.Schema({

  // Anonymous — no userId stored
  anonymousToken: {
    type: String,
    required: true,
    // SCALE: Nominal — hashed identifier; no order
    _scale: 'Nominal',
  },

  // SCALE: Nominal — category membership; no ordering between categories
  // MEASUREMENT TYPE: Direct (categorical assignment)
  category: {
    type: String,
    enum: SUPPORT_CATEGORIES,
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct (categorical)',
    _note: '"Anxiety" is not > or < "Stress"; they are simply different classes.',
  },

  content: {
    type: String,
    required: true,
    maxlength: 2000,
    _scale: 'Nominal (free text)',
  },

  isFlagged: {
    type: Boolean,
    default: false,
    _scale: 'Nominal (binary)',
  },

  createdAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

});


// ── 4. GAMIFIED STREAKS ───────────────────────────────────────
/**
 * SCALE: Ratio / Absolute
 *   - True zero exists (0 consecutive days = no streak).
 *   - All arithmetic is valid: 10 days is twice as long as 5 days.
 * MEASUREMENT TYPE: Direct
 */
const StreakSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  currentStreak: {
    type: Number,
    default: 0,
    min: 0,
    // SCALE: Ratio — count with true zero
    // MEASUREMENT TYPE: Direct
    _scale: 'Ratio',
    _measurement: 'Direct',
  },

  longestStreak: {
    type: Number,
    default: 0,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Direct',
  },

  lastActivityDate: {
    type: Date,
    _scale: 'Ratio',
  },

  totalActiveDays: {
    type: Number,
    default: 0,
    min: 0,
    _scale: 'Absolute',
    _measurement: 'Direct',
  },

});


// ── 5. RESOURCE HUB VIDEO ─────────────────────────────────────
const ResourceSchema = new mongoose.Schema({

  title: { type: String, required: true, _scale: 'Nominal' },

  category: {
    type: String,
    enum: SUPPORT_CATEGORIES,
    // SCALE: Nominal
    _scale: 'Nominal',
  },

  // SCALE: Ratio — true zero; 2× views = twice as popular
  // MEASUREMENT TYPE: Direct
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Direct',
  },

  // SCALE: Ordinal — 1–5 star rating; order meaningful, gaps not
  averageRating: {
    type: Number,
    min: 1,
    max: 5,
    _scale: 'Ordinal',
    _measurement: 'Direct (aggregated)',
  },

  url: { type: String, required: true, _scale: 'Nominal' },

});


// ── 6. HEALTH SCORE (Indirect Measurement) ───────────────────
/**
 * INDIRECT MEASUREMENT — "User Engagement / Health Score"
 *
 * Combines multiple DIRECT measurements into a composite metric.
 * Formula (stored for audit; recomputed nightly):
 *
 *   healthScore = (normalizedStreak × 0.40)
 *               + (normalizedVibeAvg × 0.35)
 *               + (normalizedLoginFreq × 0.25)
 *
 * Each component is first normalised to [0, 100] before weighting
 * so that scale differences don't bias the result.
 *
 * SCALE of result: Interval (not Ratio) — zero does not mean
 * "no health"; it means the minimum observed composite score.
 */
const HealthScoreSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  computedAt: { type: Date, default: Date.now, _scale: 'Ratio' },

  // Raw inputs (Direct, Absolute/Ratio)
  streakDays:       { type: Number, _scale: 'Ratio',    _measurement: 'Direct' },
  vibeCheckIns:     { type: Number, _scale: 'Absolute', _measurement: 'Direct' },
  averageVibeScore: { type: Number, _scale: 'Ordinal',  _measurement: 'Direct (aggregated)' },
  loginCount:       { type: Number, _scale: 'Absolute', _measurement: 'Direct' },

  // Derived composite (Indirect)
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    // SCALE: Interval (composite; zero is arbitrary lower bound)
    // MEASUREMENT TYPE: Indirect
    _scale: 'Interval',
    _measurement: 'Indirect',
    _formula: '0.40 * normStreak + 0.35 * normVibeAvg + 0.25 * normLoginFreq',
  },

  engagementTier: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Excellent'],
    // SCALE: Ordinal — tier order is meaningful; gaps are not uniform
    _scale: 'Ordinal',
    _measurement: 'Indirect (derived from healthScore)',
  },

});
// ── 4. GOAL-BASED MEASUREMENT (GBM) SCHEMAS ──────────────────
/**
 * Goal-Based Measurement implementation following GQM paradigm.
 * Goals → Questions → Metrics hierarchy for personalized mental health tracking.
 */

// ── 4.1 GOAL SCHEMA ───────────────────────────────────────────
/**
 * Formalized measurement goal following GQ(I)M structure:
 * - Object: What to measure (e.g., "My anxiety levels")
 * - Purpose: Why measure (e.g., "to reduce", "to understand")
 * - Perspective: Who cares (e.g., "myself", "therapist")
 * - Environment: Context (e.g., "during exams", "daily life")
 */
const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // GQ(I)M Components
  object: {
    type: String,
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'What entity to measure (e.g., "my mood", "anxiety episodes")',
  },

  purpose: {
    type: String,
    required: true,
    enum: ['understand', 'predict', 'control', 'improve', 'reduce'],
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Reason for measurement',
  },

  perspective: {
    type: String,
    required: true,
    enum: ['myself', 'therapist', 'family', 'school'],
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Who is interested in the results',
  },

  environment: {
    type: String,
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Context and constraints (e.g., "during semester", "work stress")',
  },

  // Goal classification
  type: {
    type: String,
    enum: ['active', 'passive'],
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Active: control/change processes; Passive: learn/understand',
  },

  title: {
    type: String,
    required: true,
    maxlength: 200,
    _scale: 'Nominal',
  },

  description: {
    type: String,
    maxlength: 1000,
    _scale: 'Nominal',
  },

  isActive: {
    type: Boolean,
    default: true,
    _scale: 'Nominal (binary)',
  },

  createdAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

}, { timestamps: true });


// ── 4.2 QUESTION SCHEMA ───────────────────────────────────────
/**
 * Questions derived from goals in GQM hierarchy.
 * Each question determines if a goal is being met.
 */
const QuestionSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
  },

  question: {
    type: String,
    required: true,
    maxlength: 500,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Question to determine goal achievement (e.g., "What is my average mood this week?")',
  },

  category: {
    type: String,
    enum: ['people', 'process', 'product', 'resource', 'quality'],
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'GQM category grouping',
  },

  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
    _scale: 'Ordinal',
    _measurement: 'Direct',
  },

  createdAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

}, { timestamps: true });


// ── 4.3 METRIC SCHEMA ─────────────────────────────────────────
/**
 * Metrics that answer questions in GQM hierarchy.
 * Each metric has a data source and calculation method.
 */
const MetricSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },

  name: {
    type: String,
    required: true,
    maxlength: 100,
    _scale: 'Nominal',
  },

  description: {
    type: String,
    maxlength: 300,
    _scale: 'Nominal',
  },

  // Entity classification (GBM)
  entityType: {
    type: String,
    enum: ['process', 'product', 'resource'],
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'GBM entity category',
  },

  // Attribute classification (GBM)
  attributeType: {
    type: String,
    enum: ['internal', 'external'],
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Internal: entity properties; External: environment/behavior',
  },

  // Measurement scale
  scale: {
    type: String,
    enum: ['nominal', 'ordinal', 'interval', 'ratio', 'absolute'],
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
  },

  // Data source and calculation
  dataSource: {
    type: String,
    enum: ['vibe_checkins', 'support_posts', 'journals', 'logins', 'computed'],
    required: true,
    _scale: 'Nominal',
  },

  calculation: {
    type: String,
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'How to compute the metric (e.g., "AVG(moodValue)", "COUNT(category=Anxiety)")',
  },

  unit: {
    type: String,
    maxlength: 50,
    _scale: 'Nominal',
    _note: 'Unit of measurement (e.g., "score", "count", "percentage")',
  },

  targetValue: {
    type: Number,
    _scale: 'Ratio',
    _note: 'Target value for goal achievement',
  },

  targetDirection: {
    type: String,
    enum: ['increase', 'decrease', 'maintain'],
    _scale: 'Nominal',
  },

  isActive: {
    type: Boolean,
    default: true,
    _scale: 'Nominal (binary)',
  },

  createdAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

}, { timestamps: true });


// ── 4.4 MEASUREMENT RESULT SCHEMA ─────────────────────────────
/**
 * Stores computed metric values over time for tracking progress.
 */
const MeasurementResultSchema = new mongoose.Schema({
  metricId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Metric',
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  value: {
    type: Number,
    required: true,
    _scale: 'Ratio',
    _measurement: 'Direct or Indirect',
  },

  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
    _scale: 'Nominal',
  },

  periodStart: {
    type: Date,
    required: true,
    _scale: 'Ratio',
  },

  periodEnd: {
    type: Date,
    required: true,
    _scale: 'Ratio',
  },

  computedAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },

}, { timestamps: true });


// ── 4.5 COMPLEXITY METRICS ─────────────────────────────────────
/**
 * Complexity metrics schema for developer-facing maintainability tracking.
 * SCALE TYPES:
 *   - Cyclomatic Complexity → Ratio
 *   - Halstead Volume/Difficulty/Effort → Ratio
 *   - Reuse Count → Absolute
 */
const ComplexitySchema = new mongoose.Schema({
  moduleName: {
    type: String,
    required: true,
    _scale: 'Nominal',
    _measurement: 'Direct',
    _note: 'Name of the module or function analyzed',
  },

  cyclomaticComplexity: {
    type: Number,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Direct',
    _note: 'Independent paths through the code',
  },

  halsteadVolume: {
    type: Number,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Direct',
    _note: 'Program size in terms of operators/operands',
  },

  halsteadDifficulty: {
    type: Number,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Direct',
    _note: 'Relative difficulty of understanding the code',
  },

  halsteadEffort: {
    type: Number,
    min: 0,
    _scale: 'Ratio',
    _measurement: 'Indirect',
    _note: 'Estimated effort to implement/understand',
  },

  reuseCount: {
    type: Number,
    min: 0,
    _scale: 'Absolute',
    _measurement: 'Direct',
    _note: 'Number of reused functions/libraries',
  },

  analyzedAt: {
    type: Date,
    default: Date.now,
    _scale: 'Ratio',
  },
});


// ── EXPORTS ───────────────────────────────────────────────────
module.exports = {
  User:         mongoose.model('User',         UserSchema),
  VibeCheckIn:  mongoose.model('VibeCheckIn',  VibeCheckInSchema),
  SupportPost:  mongoose.model('SupportPost',  SupportPostSchema),
  Streak:       mongoose.model('Streak',       StreakSchema),
  Resource:     mongoose.model('Resource',     ResourceSchema),
  HealthScore:  mongoose.model('HealthScore',  HealthScoreSchema),
  Complexity:   mongoose.model('Complexity',   ComplexitySchema),
  // Constants
  VIBE_SCALE,
  SUPPORT_CATEGORIES,
};


/* ──────────────────────────────────────────────────────────────
   EQUIVALENT SQL DDL (PostgreSQL)
   Each column comment states its measurement-theory scale.
   ──────────────────────────────────────────────────────────────

CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  username         VARCHAR(50)  UNIQUE NOT NULL,  -- Nominal
  email            VARCHAR(255) UNIQUE NOT NULL,  -- Nominal
  total_logins     INT DEFAULT 0 CHECK (total_logins >= 0),  -- Absolute / Direct
  total_journals   INT DEFAULT 0 CHECK (total_journals >= 0), -- Absolute / Direct
  created_at       TIMESTAMPTZ DEFAULT NOW()      -- Ratio
);

CREATE TABLE vibe_checkins (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id),
  mood_value   SMALLINT NOT NULL CHECK (mood_value BETWEEN 1 AND 5), -- Ordinal / Direct
  mood_label   VARCHAR(10),                                           -- Nominal
  notes        TEXT,                                                  -- Nominal (free text)
  recorded_at  TIMESTAMPTZ DEFAULT NOW()                              -- Ratio
);

CREATE TABLE support_posts (
  id               SERIAL PRIMARY KEY,
  anonymous_token  VARCHAR(64) NOT NULL,     -- Nominal
  category         VARCHAR(30) NOT NULL,     -- Nominal / Direct (categorical)
  content          TEXT NOT NULL,            -- Nominal (free text)
  is_flagged       BOOLEAN DEFAULT FALSE,    -- Nominal (binary)
  created_at       TIMESTAMPTZ DEFAULT NOW() -- Ratio
);

CREATE TABLE streaks (
  id                 SERIAL PRIMARY KEY,
  user_id            INT UNIQUE REFERENCES users(id),
  current_streak     INT DEFAULT 0 CHECK (current_streak >= 0),  -- Ratio / Direct
  longest_streak     INT DEFAULT 0 CHECK (longest_streak >= 0),  -- Ratio / Direct
  total_active_days  INT DEFAULT 0 CHECK (total_active_days >= 0), -- Absolute / Direct
  last_activity_date DATE                                         -- Ratio
);

CREATE TABLE health_scores (
  id                SERIAL PRIMARY KEY,
  user_id           INT REFERENCES users(id),
  streak_days       INT,           -- Ratio    / Direct (input)
  vibe_checkins     INT,           -- Absolute / Direct (input)
  avg_vibe_score    NUMERIC(3,2),  -- Ordinal  / Direct aggregated (input)
  login_count       INT,           -- Absolute / Direct (input)
  health_score      NUMERIC(5,2),  -- Interval / INDIRECT (composite output)
  engagement_tier   VARCHAR(10),   -- Ordinal  / Indirect
  computed_at       TIMESTAMPTZ DEFAULT NOW()
);

*/
