/**
 * ============================================================
 * measurementValidation.js
 *
 * Validates that the FORMAL Relational System (numeric values
 * stored in the database) never conflicts with the EMPIRICAL
 * Relational System (the real-world ordering of emotional states,
 * streaks, and engagement tiers).
 *
 * Measurement Theory basis (Chapter 2):
 *   A measurement mapping φ: E → N is valid IFF for every pair
 *   of entities e1, e2 ∈ E:
 *       e1 ≿ e2  (empirical)  ⟺  φ(e1) ≥ φ(e2)  (formal)
 *
 * If this homomorphism is violated, the measurement is meaningless.
 * ============================================================
 */

// ── ORDINAL VIBE SCALE ────────────────────────────────────────
/**
 * The canonical empirical ordering of moods (ground truth).
 * Index = formal numeric value (1-based).
 * Invariant: VIBE_ORDER[i].value === i + 1
 */
const VIBE_ORDER = [
  { label: 'Terrible', emoji: '😢', value: 1 },
  { label: 'Down',     emoji: '😞', value: 2 },
  { label: 'Neutral',  emoji: '😐', value: 3 },
  { label: 'Good',     emoji: '🙂', value: 4 },
  { label: 'Great',    emoji: '😄', value: 5 },
];

// Build lookup maps for O(1) access
const VIBE_BY_LABEL = Object.fromEntries(VIBE_ORDER.map(v => [v.label, v]));
const VIBE_BY_VALUE = Object.fromEntries(VIBE_ORDER.map(v => [v.value, v]));

// ── ORDINAL ENGAGEMENT TIERS ──────────────────────────────────
const ENGAGEMENT_ORDER = ['Low', 'Moderate', 'High', 'Excellent'];
const ENGAGEMENT_RANK  = Object.fromEntries(ENGAGEMENT_ORDER.map((t, i) => [t, i]));

// ── NOMINAL SUPPORT CATEGORIES ────────────────────────────────
const SUPPORT_CATEGORIES = new Set([
  'Anxiety', 'Depression', 'Stress', 'Burnout',
  'Study Tips', 'Relationships', 'General Wellness',
]);


// ────────────────────────────────────────────────────────────
// 1. VIBE CHECK-IN VALIDATORS
// ────────────────────────────────────────────────────────────

/**
 * Validates a single vibe check-in record.
 *
 * Rules enforced:
 *  (a) moodValue must be an integer in [1, 5]           — Ordinal bounds
 *  (b) moodLabel must map to the correct moodValue       — Homomorphism
 *  (c) 'Sad/Terrible' must never be numerically ≥ 'Happy/Great'
 *      (ensures empirical order ≡ formal order)
 *
 * @param {{ moodValue: number, moodLabel: string }} checkIn
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateVibeCheckIn({ moodValue, moodLabel }) {
  const errors = [];

  // (a) Range check
  if (!Number.isInteger(moodValue) || moodValue < 1 || moodValue > 5) {
    errors.push(
      `[Ordinal violation] moodValue=${moodValue} is outside the valid range [1, 5].`
    );
  }

  // (b) Label ↔ Value homomorphism
  const canonicalEntry = VIBE_BY_LABEL[moodLabel];
  if (!canonicalEntry) {
    errors.push(`[Nominal violation] Unknown moodLabel "${moodLabel}".`);
  } else if (canonicalEntry.value !== moodValue) {
    errors.push(
      `[Homomorphism violation] "${moodLabel}" maps to formal value ` +
      `${canonicalEntry.value}, but stored value is ${moodValue}. ` +
      `The Formal Relational System conflicts with the Empirical ordering.`
    );
  }

  // (c) Critical ordinal sanity: Sad must never be ≥ Happy
  const sadEntry  = VIBE_BY_LABEL['Terrible'];
  const happyEntry = VIBE_BY_LABEL['Great'];
  if (sadEntry.value >= happyEntry.value) {
    errors.push(
      `[Empirical order violation] "Terrible" (${sadEntry.value}) ` +
      `is not less than "Great" (${happyEntry.value}). ` +
      `The ordinal scale homomorphism φ(Terrible) < φ(Great) is violated.`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a sequence of check-ins never has duplicate
 * timestamps (same user, same second) — a data quality guard.
 *
 * @param {Array<{ recordedAt: Date }>} checkIns  - sorted by recordedAt
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateVibeTimestamps(checkIns) {
  const errors = [];
  for (let i = 1; i < checkIns.length; i++) {
    if (checkIns[i].recordedAt.getTime() === checkIns[i - 1].recordedAt.getTime()) {
      errors.push(
        `[Ratio scale violation] Duplicate timestamp at index ${i}: ` +
        `${checkIns[i].recordedAt.toISOString()}. Each measurement event must be unique.`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}


// ────────────────────────────────────────────────────────────
// 2. STREAK VALIDATORS
// ────────────────────────────────────────────────────────────

/**
 * Validates a streak record.
 *
 * Rules:
 *  (a) currentStreak >= 0                    — Ratio: true zero exists
 *  (b) longestStreak >= currentStreak        — longest ≥ current always
 *  (c) totalActiveDays >= currentStreak      — total days ≥ current streak
 *  (d) All values are non-negative integers  — Absolute/Ratio semantics
 *
 * @param {{ currentStreak: number, longestStreak: number, totalActiveDays: number }} streak
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateStreak({ currentStreak, longestStreak, totalActiveDays }) {
  const errors = [];

  const fields = { currentStreak, longestStreak, totalActiveDays };
  for (const [name, val] of Object.entries(fields)) {
    if (!Number.isInteger(val) || val < 0) {
      errors.push(
        `[Ratio/Absolute violation] "${name}" must be a non-negative integer. ` +
        `Received: ${val}. A true zero (no activity) is valid; negative counts are not.`
      );
    }
  }

  if (longestStreak < currentStreak) {
    errors.push(
      `[Ratio order violation] longestStreak (${longestStreak}) < ` +
      `currentStreak (${currentStreak}). The longest streak must always be ≥ the current.`
    );
  }

  if (totalActiveDays < currentStreak) {
    errors.push(
      `[Absolute scale violation] totalActiveDays (${totalActiveDays}) < ` +
      `currentStreak (${currentStreak}). Cannot have a streak longer than total active days.`
    );
  }

  return { valid: errors.length === 0, errors };
}


// ────────────────────────────────────────────────────────────
// 3. SUPPORT CATEGORY VALIDATORS (Nominal)
// ────────────────────────────────────────────────────────────

/**
 * Validates a support post category.
 *
 * Rules:
 *  (a) Category must be a known, defined class (Nominal membership).
 *  (b) No numeric comparison between categories is ever performed.
 *
 * @param {string} category
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSupportCategory(category) {
  const errors = [];

  if (!SUPPORT_CATEGORIES.has(category)) {
    errors.push(
      `[Nominal violation] "${category}" is not a recognised Support Circle category. ` +
      `Valid classes: ${[...SUPPORT_CATEGORIES].join(', ')}.`
    );
  }

  return { valid: errors.length === 0, errors };
}


// ────────────────────────────────────────────────────────────
// 4. HEALTH SCORE VALIDATORS (Indirect Measurement)
// ────────────────────────────────────────────────────────────

/**
 * Validates a computed Health Score record.
 *
 * The Health Score is an INDIRECT measurement combining:
 *   - streakDays       (Ratio   / Direct)
 *   - vibeCheckIns     (Absolute / Direct)
 *   - averageVibeScore (Ordinal  / Direct aggregated)
 *   - loginCount       (Absolute / Direct)
 *
 * Rules:
 *  (a) healthScore must be in [0, 100]         — Interval bounds
 *  (b) engagementTier must follow ordinal order relative to healthScore
 *  (c) Input fields must satisfy their own scale constraints
 *
 * @param {{ streakDays, vibeCheckIns, averageVibeScore, loginCount,
 *           healthScore, engagementTier }} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateHealthScore(record) {
  const errors = [];
  const { streakDays, vibeCheckIns, averageVibeScore,
          loginCount, healthScore, engagementTier } = record;

  // (a) Composite score range
  if (typeof healthScore !== 'number' || healthScore < 0 || healthScore > 100) {
    errors.push(
      `[Interval violation] healthScore=${healthScore} must be in [0, 100].`
    );
  }

  // (b) Engagement tier matches score range
  const tierBounds = {
    Low:       [0,  25],
    Moderate: [26,  50],
    High:     [51,  75],
    Excellent:[76, 100],
  };
  const bounds = tierBounds[engagementTier];
  if (!bounds) {
    errors.push(`[Ordinal violation] Unknown engagementTier: "${engagementTier}".`);
  } else if (healthScore < bounds[0] || healthScore > bounds[1]) {
    errors.push(
      `[Ordinal–Interval mismatch] engagementTier "${engagementTier}" expects ` +
      `healthScore in [${bounds[0]}, ${bounds[1]}], but got ${healthScore}.`
    );
  }

  // (c) Input field scale constraints
  for (const [name, val] of Object.entries({ streakDays, vibeCheckIns, loginCount })) {
    if (!Number.isInteger(val) || val < 0) {
      errors.push(
        `[Absolute/Ratio violation] Input field "${name}" must be a non-negative integer. Got: ${val}.`
      );
    }
  }

  if (typeof averageVibeScore !== 'number' || averageVibeScore < 1 || averageVibeScore > 5) {
    errors.push(
      `[Ordinal violation] averageVibeScore=${averageVibeScore} must be in [1, 5].`
    );
  }

  return { valid: errors.length === 0, errors };
}


// ────────────────────────────────────────────────────────────
// 5. HEALTH SCORE COMPUTATION (Indirect Measurement formula)
// ────────────────────────────────────────────────────────────

/**
 * Computes the indirect Health Score from direct measurements.
 *
 * Normalisation step converts each input to [0, 100] before
 * weighting, ensuring no single scale dominates.
 *
 * @param {object} params
 * @param {number} params.streakDays       - current streak (Ratio)
 * @param {number} params.vibeCheckIns     - count of check-ins this month (Absolute)
 * @param {number} params.averageVibeScore - mean mood score 1-5 (Ordinal aggregated)
 * @param {number} params.loginCount       - logins this month (Absolute)
 * @param {object} [params.maxValues]      - population maxima for normalisation
 * @returns {{ healthScore: number, engagementTier: string, breakdown: object }}
 */
function computeHealthScore({
  streakDays,
  vibeCheckIns,
  averageVibeScore,
  loginCount,
  maxValues = { streakDays: 30, vibeCheckIns: 30, loginCount: 60 },
}) {
  // Normalise each direct measure to [0, 100]
  const normStreak  = Math.min(streakDays   / maxValues.streakDays,   1) * 100;
  const normCheckins = Math.min(vibeCheckIns / maxValues.vibeCheckIns, 1) * 100;
  const normVibe    = ((averageVibeScore - 1) / 4) * 100;        // map [1,5] → [0,100]
  const normLogins  = Math.min(loginCount   / maxValues.loginCount,   1) * 100;

  // Weighted composite — weights must sum to 1.0
  const healthScore = +(
    normStreak   * 0.40 +
    normVibe     * 0.35 +
    normLogins   * 0.15 +
    normCheckins * 0.10
  ).toFixed(2);

  // Derive ordinal engagement tier from interval health score
  let engagementTier;
  if      (healthScore >= 76) engagementTier = 'Excellent';
  else if (healthScore >= 51) engagementTier = 'High';
  else if (healthScore >= 26) engagementTier = 'Moderate';
  else                         engagementTier = 'Low';

  return {
    healthScore,
    engagementTier,
    breakdown: {
      normStreak:   +normStreak.toFixed(2),
      normVibe:     +normVibe.toFixed(2),
      normLogins:   +normLogins.toFixed(2),
      normCheckins: +normCheckins.toFixed(2),
    },
  };
}


// ────────────────────────────────────────────────────────────
// 6. AGGREGATE VALIDATOR (run all checks at once)
// ────────────────────────────────────────────────────────────

/**
 * Runs every validation function against a full user snapshot.
 *
 * @param {object} snapshot - All measurement data for one user
 * @returns {{ allValid: boolean, results: object }}
 */
function validateFullSnapshot(snapshot) {
  const results = {};

  results.vibeCheckIn = validateVibeCheckIn(snapshot.latestCheckIn || {});
  results.streak      = validateStreak(snapshot.streak || {});
  results.category    = validateSupportCategory(snapshot.category || '');
  results.healthScore = validateHealthScore(snapshot.healthScore || {});
  results.complexity  = validateComplexity(snapshot.complexity || {});

  const allValid = Object.values(results).every(r => r.valid);
  return { allValid, results };
}


// ────────────────────────────────────────────────────────────
// UNIT TEST RUNNER (Node.js — run with: node measurementValidation.js)
// ────────────────────────────────────────────────────────────
function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Measurement Theory Validation — Test Suite');
  console.log('═══════════════════════════════════════════════════\n');

  const tests = [
    {
      name: '✅ Valid vibe check-in (Neutral / 3)',
      fn: () => validateVibeCheckIn({ moodValue: 3, moodLabel: 'Neutral' }),
    },
    {
      name: '❌ Homomorphism violation: "Great" labelled as value 1',
      fn: () => validateVibeCheckIn({ moodValue: 1, moodLabel: 'Great' }),
    },
    {
      name: '❌ Ordinal out-of-range: moodValue = 6',
      fn: () => validateVibeCheckIn({ moodValue: 6, moodLabel: 'Great' }),
    },
    {
      name: '✅ Valid streak',
      fn: () => validateStreak({ currentStreak: 7, longestStreak: 14, totalActiveDays: 20 }),
    },
    {
      name: '❌ Ratio violation: negative streak',
      fn: () => validateStreak({ currentStreak: -1, longestStreak: 5, totalActiveDays: 10 }),
    },
    {
      name: '❌ Order violation: longestStreak < currentStreak',
      fn: () => validateStreak({ currentStreak: 10, longestStreak: 5, totalActiveDays: 15 }),
    },
    {
      name: '✅ Valid support category (Nominal)',
      fn: () => validateSupportCategory('Anxiety'),
    },
    {
      name: '❌ Nominal violation: unknown category',
      fn: () => validateSupportCategory('Existential Dread'),
    },
    {
      name: '✅ Valid health score (Indirect)',
      fn: () => validateHealthScore({
        streakDays: 7, vibeCheckIns: 15, averageVibeScore: 4.2,
        loginCount: 20, healthScore: 72.5, engagementTier: 'High',
      }),
    },
    {
      name: '❌ Tier–score mismatch (Indirect measurement error)',
      fn: () => validateHealthScore({
        streakDays: 7, vibeCheckIns: 15, averageVibeScore: 4.2,
        loginCount: 20, healthScore: 15, engagementTier: 'Excellent',
      }),
    },
    {
      name: '📊 Health Score computation demo',
      fn: () => {
        const result = computeHealthScore({
          streakDays: 10, vibeCheckIns: 20,
          averageVibeScore: 3.8, loginCount: 30,
        });
        return { valid: true, errors: [], computed: result };
      },
    },
  ];

  tests.forEach(({ name, fn }) => {
    const result = fn();
    const status = result.valid ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${name}`);
    if (result.errors && result.errors.length) {
      result.errors.forEach(e => console.log(`       ⚠  ${e}`));
    }
    if (result.computed) {
      console.log('       📈', JSON.stringify(result.computed, null, 2)
        .split('\n').join('\n       '));
    }
    console.log();
  });
}

if (require.main === module) {
  runTests();
}
// ────────────────────────────────────────────────────────────
// 7. GOAL-BASED MEASUREMENT (GBM) VALIDATORS
// ────────────────────────────────────────────────────────────

// ── GBM CONSTANTS ────────────────────────────────────────────
const GBM_ENTITY_TYPES = new Set(['process', 'product', 'resource']);
const GBM_ATTRIBUTE_TYPES = new Set(['internal', 'external']);
const MEASUREMENT_SCALES = new Set(['nominal', 'ordinal', 'interval', 'ratio', 'absolute']);
const GQM_CATEGORIES = new Set(['people', 'process', 'product', 'resource', 'quality']);
const DATA_SOURCES = new Set(['vibe_checkins', 'support_posts', 'journals', 'logins', 'computed']);

// ── VALIDATE GOAL ────────────────────────────────────────────
function validateGoal(goal) {
  const errors = [];

  // Required GQ(I)M components
  if (!goal.object || typeof goal.object !== 'string') {
    errors.push('Goal must have a valid object (what to measure)');
  }

  if (!['understand', 'predict', 'control', 'improve', 'reduce'].includes(goal.purpose)) {
    errors.push('Goal must have a valid purpose (understand/predict/control/improve/reduce)');
  }

  if (!['myself', 'therapist', 'family', 'school'].includes(goal.perspective)) {
    errors.push('Goal must have a valid perspective (myself/therapist/family/school)');
  }

  if (!goal.environment || typeof goal.environment !== 'string') {
    errors.push('Goal must have a valid environment (context/constraints)');
  }

  if (!['active', 'passive'].includes(goal.type)) {
    errors.push('Goal must specify type (active/passive)');
  }

  if (!goal.title || goal.title.length > 200) {
    errors.push('Goal must have a title (max 200 characters)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ── VALIDATE QUESTION ────────────────────────────────────────
function validateQuestion(question) {
  const errors = [];

  if (!question.question || question.question.length > 500) {
    errors.push('Question must be provided (max 500 characters)');
  }

  if (!GQM_CATEGORIES.has(question.category)) {
    errors.push('Question must have a valid GQM category (people/process/product/resource/quality)');
  }

  if (question.priority < 1 || question.priority > 5) {
    errors.push('Question priority must be between 1-5');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ── VALIDATE METRIC ──────────────────────────────────────────
function validateMetric(metric) {
  const errors = [];

  if (!metric.name || metric.name.length > 100) {
    errors.push('Metric must have a name (max 100 characters)');
  }

  if (!GBM_ENTITY_TYPES.has(metric.entityType)) {
    errors.push('Metric must have a valid entity type (process/product/resource)');
  }

  if (!GBM_ATTRIBUTE_TYPES.has(metric.attributeType)) {
    errors.push('Metric must have a valid attribute type (internal/external)');
  }

  if (!MEASUREMENT_SCALES.has(metric.scale)) {
    errors.push('Metric must have a valid measurement scale (nominal/ordinal/interval/ratio/absolute)');
  }

  if (!DATA_SOURCES.has(metric.dataSource)) {
    errors.push('Metric must have a valid data source');
  }

  if (!metric.calculation) {
    errors.push('Metric must have a calculation method');
  }

  // Validate target direction consistency
  if (metric.targetValue !== undefined && !metric.targetDirection) {
    errors.push('Metric with target value must specify target direction (increase/decrease/maintain)');
  }

  if (metric.targetDirection && !['increase', 'decrease', 'maintain'].includes(metric.targetDirection)) {
    errors.push('Target direction must be increase/decrease/maintain');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ── VALIDATE GQM HIERARCHY ───────────────────────────────────
function validateGQMHierarchy(goal, questions, metrics) {
  const errors = [];

  // Goal validation
  const goalValidation = validateGoal(goal);
  if (!goalValidation.valid) {
    errors.push(...goalValidation.errors.map(e => `Goal: ${e}`));
  }

  // Questions validation and relationship
  if (!questions || questions.length === 0) {
    errors.push('Goal must have at least one question');
  } else {
    questions.forEach((q, i) => {
      const qValidation = validateQuestion(q);
      if (!qValidation.valid) {
        errors.push(...qValidation.errors.map(e => `Question ${i+1}: ${e}`));
      }
    });
  }

  // Metrics validation and relationship
  if (!metrics || metrics.length === 0) {
    errors.push('Goal must have at least one metric');
  } else {
    metrics.forEach((m, i) => {
      const mValidation = validateMetric(m);
      if (!mValidation.valid) {
        errors.push(...mValidation.errors.map(e => `Metric ${i+1}: ${e}`));
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ── VALIDATE MEASUREMENT RESULT ──────────────────────────────
function validateMeasurementResult(result) {
  const errors = [];

  if (typeof result.value !== 'number' || isNaN(result.value)) {
    errors.push('Measurement result must have a valid numeric value');
  }

  if (!['daily', 'weekly', 'monthly'].includes(result.period)) {
    errors.push('Measurement period must be daily/weekly/monthly');
  }

  if (!result.periodStart || !result.periodEnd) {
    errors.push('Measurement result must have period start and end dates');
  }

  if (result.periodStart >= result.periodEnd) {
    errors.push('Period start must be before period end');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates complexity metrics against defined thresholds.
 *
 * Rules:
 *  (a) Cyclomatic Complexity must be ≥ 0 and ≤ 10
 *  (b) Halstead Effort must be ≥ 0 and ≤ 20,000
 *  (c) Reuse Count must be a non-negative integer
 *
 * @param {{ cyclomaticComplexity: number, halsteadEffort: number, reuseCount: number }}
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateComplexity({ cyclomaticComplexity, halsteadEffort, reuseCount }) {
  const errors = [];

  if (typeof cyclomaticComplexity !== 'number' || cyclomaticComplexity < 0) {
    errors.push(`[Complexity violation] Cyclomatic complexity must be ≥ 0. Got: ${cyclomaticComplexity}`);
  } else if (cyclomaticComplexity > 10) {
    errors.push(`[Complexity violation] Cyclomatic complexity ${cyclomaticComplexity} exceeds threshold of 10.`);
  }

  if (typeof halsteadEffort !== 'number' || halsteadEffort < 0) {
    errors.push(`[Complexity violation] Halstead effort must be ≥ 0. Got: ${halsteadEffort}`);
  } else if (halsteadEffort > 20000) {
    errors.push(`[Complexity violation] Halstead effort ${halsteadEffort} exceeds recommended limit of 20,000.`);
  }

  if (!Number.isInteger(reuseCount) || reuseCount < 0) {
    errors.push(`[Complexity violation] Reuse count must be a non-negative integer. Got: ${reuseCount}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateVibeCheckIn,
  validateVibeTimestamps,
  validateStreak,
  validateSupportCategory,
  validateHealthScore,
  validateFullSnapshot,
  computeHealthScore,
  validateComplexity,
  VIBE_ORDER,
  VIBE_BY_LABEL,
  VIBE_BY_VALUE,
  SUPPORT_CATEGORIES,
  ENGAGEMENT_ORDER,
};
