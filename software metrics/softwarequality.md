# MindFlow: Software Quality Implementation

---

## ISO 9126 Functionality

The code provides the correct set of functions to satisfy stated needs. The five tabs (dashboard, vibe, forum, goals, scores) each implement a distinct, required capability. `handleVibeSubmit` validates input before writing to state, meaning the application only commits a check-in when it is formally correct. `handlePostSubmit` guards the forum in the same way, rejecting empty submissions before they reach state. The `computeHealthScore` function is deterministic: identical inputs always produce the same output with no side effects, satisfying the accuracy sub-characteristic. The GQM goal structure in the `goals` array implements the full functionality of goal definition, question association, metric specification, and result tracking as a complete and suitability-aligned feature set.

---

## ISO 9126 Reliability

The code uses immutable state update patterns throughout. Every call to `setState` spreads the previous state and returns a new object rather than mutating in place, eliminating the class of faults caused by shared mutable references. The `validateCheckIn` function acts as a fault barrier positioned before the state write: an invalid check-in is caught and rejected with an error message before it can corrupt `checkInHistory`, which feeds both the sparkline and the average vibe calculation. The toast system calls `setTimeout` to clear itself after 3500 milliseconds, preventing a stale success or error message from persisting across subsequent interactions and misleading the user. The application holds no external runtime dependencies, so there is no network call, database connection, or file system read that can fail during use.

---

## ISO 9126 Usability

The tab navigation renders one view at a time. A student at the forum tab is never presented with the goal creation controls or the score breakdown. The `navBtn` style function visually distinguishes the active tab with a background fill and colour change, giving the user a constant location signal. The mood selection buttons render an emoji, a text label, and the formal φ value together in a single button, allowing a student to confirm their selection at a glance without reading supporting text. The inline scale tags (`Nominal`, `Ordinal`, `Ratio`, `Absolute`, `Interval`) displayed as small badges throughout the dashboard, vibe, and scores tabs serve as embedded context that explains what each number means without requiring the user to navigate elsewhere. The validation result from `validateCheckIn` renders inline directly below the mood selector, not in a modal or a separate panel, reducing the steps a student must take to understand and correct an error.

---

## ISO 9126 Efficiency

The application makes no external API calls, no database queries, and no file system accesses at runtime. All computation runs synchronously against small in-memory arrays. `MoodSparkline` computes its SVG path coordinates in a single `map` call over the seven-element `checkInHistory` array and produces no side effects. `CircularScore` derives its `stroke-dasharray` value from a single arithmetic expression. The `computeHealthScore` function performs four normalisations and one weighted sum with no loops or recursion. Bar fill animations use a CSS `transition` property with `cubic-bezier` easing, delegating animation work to the browser compositor rather than running a JavaScript animation loop on the main thread. The `styles` object is defined once at module level and referenced by all components, avoiding repeated object allocation on every render.

---

## ISO 9126 Maintainability

All measurement constants are declared at the top of the file as named module-level arrays: `VIBE_SCALE`, `SUPPORT_CATEGORIES`, `ENGAGEMENT_TIERS`, `GBM_ENTITY_TYPES`, `GBM_ATTRIBUTE_TYPES`, `MEASUREMENT_SCALES`, `GQM_CATEGORIES`, `DATA_SOURCES`, `GQIM_PURPOSES`, `GQIM_PERSPECTIVES`, and `GQIM_TYPES`. Adding a new mood, a new forum category, a new engagement band, or a new GQM purpose requires changing one array entry and nothing else; the rest of the application reads these constants at render time. `computeHealthScore` takes four plain numeric arguments and returns a plain object. It does not close over state, does not call `setState`, and does not depend on any React context, making it fully testable in isolation. `validateCheckIn` has the same property: it reads only `VIBE_SCALE` and its two arguments, and it returns a plain `{ valid, error }` object whose two branches cover all possible inputs. The `catColor` function maps category strings to hex values in a single lookup object, meaning a colour change for any category requires editing one string in one place.

---

## ISO 9126 Portability

The application is written in standard React with no native platform modules, no browser extension APIs, and no environment-specific globals beyond `Date` and `Math`. It writes nothing to `localStorage`, `sessionStorage`, cookies, or any other persistent browser API: all state is held in `useState` and resets when the component unmounts, ensuring identical behaviour across browsers, devices, and tabs. The `styles` object uses plain JavaScript objects for all visual properties, with no CSS preprocessor, no build-time stylesheet compilation, and no external font or icon library loaded at runtime.

---

## ISO 9126 Reliability: Formal Measurement Validation

The `validateCheckIn` function implements three layered checks. The first check confirms that the submitted `moodLabel` exists in `VIBE_SCALE`. The second check confirms that the label's canonical numeric value matches the submitted `moodValue`, catching any homomorphism violation where the formal and empirical systems have drifted out of sync. The third check confirms that `moodValue` falls within the ordinal range of 1 to 5. All three checks must pass before the system accepts a check-in. This structure means the application's reliability is not dependent on the UI rendering correctly or the user selecting options in the expected order; the data layer validates independently of the presentation layer.

---

## McCall's Model: Product Operation Factors

**Correctness** is implemented by the deterministic scoring in `computeHealthScore` and the three-gate validation in `validateCheckIn`. The application produces the same output for any given input and rejects input that does not conform to the defined measurement system.

**Reliability** is implemented through immutable state management and the pre-write validation barrier described above.

**Efficiency** is implemented through synchronous in-memory computation and compositor-delegated animation as described in the efficiency section.

**Integrity** is implemented by the `validateCheckIn` homomorphism check, which prevents invalid formal values from entering the system regardless of how the UI is interacted with.

**Usability** is implemented through single-task tab views, inline scale documentation, and immediate inline feedback as described in the usability section.

---

## McCall's Model: Product Revision Factors

**Maintainability** is achieved through the separation of constants, computation, and presentation into distinct layers, and through the use of single-responsibility pure functions for all measurement logic.

**Testability** is achieved because `computeHealthScore` and `validateCheckIn` are pure functions with no dependencies on React state or lifecycle. Any test runner can import and call them directly.

**Flexibility** is achieved because the controlled-vocabulary arrays (`GQIM_PURPOSES`, `GQIM_PERSPECTIVES`, `GQIM_TYPES`, `GQM_CATEGORIES`) centralise the definitions that govern goal creation, meaning the goal system can be extended by editing arrays rather than restructuring logic.

---

## McCall's Model: Product Transition Factors

**Portability** is achieved as described in the portability section: no platform-specific APIs, no persistent storage, standard React only.

**Reusability** is demonstrated by `MoodSparkline` and `CircularScore`, which are parameterised components accepting value props. `MoodSparkline` takes any numeric array and renders a sparkline scaled to its range. `CircularScore` takes any value between 0 and 100 and any colour string, making both components usable anywhere a trend or score needs to be displayed without modification.

---
## Summary Table

| ISO 9126 Characteristic | Code Evidence |
|---|---|
| Functionality | `handleVibeSubmit`, `handlePostSubmit`, `computeHealthScore`, GQM `goals` structure |
| Reliability | Immutable `setState` patterns, `validateCheckIn` pre-write barrier, `setTimeout` toast cleanup |
| Usability | Single-task tabs, `navBtn` active state, inline scale tags, inline validation feedback |
| Efficiency | No API calls, synchronous array operations, CSS compositor animations, module-level `styles` |
| Maintainability | Named constant arrays, pure `computeHealthScore`, pure `validateCheckIn`, `catColor` lookup |
| Portability | No persistent APIs, no platform globals, standard React, no external runtime dependencies |
