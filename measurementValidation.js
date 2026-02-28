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

module.exports = {
  validateVibeCheckIn,
  validateVibeTimestamps,
  validateStreak,
  validateSupportCategory,
  validateHealthScore,
  validateFullSnapshot,
  computeHealthScore,
  VIBE_ORDER,
  VIBE_BY_LABEL,
  VIBE_BY_VALUE,
  SUPPORT_CATEGORIES,
  ENGAGEMENT_ORDER,
};
