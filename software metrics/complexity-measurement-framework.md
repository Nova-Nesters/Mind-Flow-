# MindFlow — Complexity Measurement Framework

## 1. Complexity Measurement Goal

> "The primary question in complexity measurement: 'How difficult is this software to understand, test, and maintain?' rather than 'How many lines of code does it have?'"

MindFlow extends its measurement theory foundation to include complexity metrics. These metrics are developer-facing and ensure that the system remains maintainable, reliable, and efficient as features grow.

## 2. Entities

- **Modules** — e.g., `computeHealthScore`, `validateFullSnapshot`
- **Functions** — individual validators, calculators, controllers
- **Processes** — validation pipeline, health score computation

## 3. Attributes Measured

- **Cyclomatic Complexity** — number of independent paths through a function.
- **Halstead Metrics** — volume, difficulty, effort based on operators and operands.
- **Reuse Metrics** — frequency and density of reused functions/libraries.

## 4. Measurement Scales

| Metric               | Scale Type | Why |
|----------------------|------------|-----|
| Cyclomatic Complexity | Ratio      | True zero exists; arithmetic valid (10 paths = 2× 5 paths). |
| Halstead Volume       | Ratio      | Count of tokens; meaningful ratios. |
| Halstead Difficulty   | Ratio      | Derived from operator/operand distribution. |
| Halstead Effort       | Ratio      | Composite measure of effort; indirect but ratio valid. |
| Reuse Count           | Absolute   | Simple count of reused modules/functions. |

## 5. Data Collection

Complexity data is collected via static analysis tools (e.g., ESLint plugins, complexity-report, radon, plato). Results are exported and stored in the backend schema for tracking over time.

## 6. Validation Rules

- Cyclomatic Complexity ≥ 0.
- Halstead Effort = Volume × Difficulty.
- Reuse Count ≥ 0.

### Thresholds

- Cyclomatic > 10 → flag for review.
- Halstead Effort > 20,000 → flag for refactor.

## 7. Indicators

- **Complexity Trend** — line chart of cyclomatic complexity per module over time.
- **Effort Estimate** — bar chart of Halstead effort per function.
- **Reuse Density** — ratio of reused vs. new code.

## 8. Integration with GBM

- **Goal:** Improve maintainability of the MindFlow codebase.
- **Question:** Which modules are hardest to maintain?
- **Metric:** Cyclomatic complexity, Halstead effort, reuse count.
- **Indicator:** Complexity dashboard panel.

## 9. Active vs. Passive Goals

| Goal Type | Example |
|-----------|---------|
| Active    | Reduce cyclomatic complexity in `computeHealthScore()` to ≤ 10. |
| Active    | Refactor modules with Halstead Effort > 20,000. |
| Passive   | Track complexity distribution across all modules. |
| Passive   | Observe reuse density trends over time. |

## 10. Sustained Operations

- Complexity analysis runs automatically in CI/CD pipeline.
- Results stored in backend schema.
- Thresholds configurable in validation logic.
- Indicators displayed in developer dashboard.
- Documentation updated as new metrics are added.
