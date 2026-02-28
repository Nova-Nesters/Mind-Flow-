import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════
//  MEASUREMENT THEORY CONSTANTS
//  Formal Relational System: φ(mood) maps Empirical → Numeric
// ═══════════════════════════════════════════════════════

const VIBE_SCALE = [                        // ORDINAL scale: order preserved
  { value: 1, label: "Terrible", emoji: "😢", color: "#ff6b8a" },
  { value: 2, label: "Down",     emoji: "😞", color: "#ff9a6c" },
  { value: 3, label: "Neutral",  emoji: "😐", color: "#ffd166" },
  { value: 4, label: "Good",     emoji: "🙂", color: "#a8d8a8" },
  { value: 5, label: "Great",    emoji: "😄", color: "#5ec4b1" },
];

const SUPPORT_CATEGORIES = [               // NOMINAL scale: unordered classes
  "Anxiety", "Depression", "Stress",
  "Burnout", "Study Tips", "Relationships", "General Wellness",
];

const ENGAGEMENT_TIERS = [                 // ORDINAL scale (derived, indirect)
  { label: "Low",       min: 0,  max: 25,  color: "#ff6b8a" },
  { label: "Moderate",  min: 26, max: 50,  color: "#ffd166" },
  { label: "High",      min: 51, max: 75,  color: "#a8d8a8" },
  { label: "Excellent", min: 76, max: 100, color: "#5ec4b1" },
];

// ── VALIDATION: Formal ↔ Empirical consistency ────────────
function validateCheckIn({ moodValue, moodLabel }) {
  const canonical = VIBE_SCALE.find(v => v.label === moodLabel);
  if (!canonical) return { valid: false, error: `Unknown mood label: "${moodLabel}"` };
  if (canonical.value !== moodValue)
    return {
      valid: false,
      error: `Homomorphism violation: "${moodLabel}" should map to ${canonical.value}, got ${moodValue}`,
    };
  if (moodValue < 1 || moodValue > 5)
    return { valid: false, error: `Ordinal out of range [1–5]: ${moodValue}` };
  return { valid: true, error: null };
}

// ── INDIRECT MEASUREMENT: Health Score ───────────────────
function computeHealthScore({ streakDays, vibeCheckIns, avgVibeScore, loginCount }) {
  const normStreak   = Math.min(streakDays    / 30, 1) * 100;
  const normVibe     = ((avgVibeScore - 1) / 4) * 100;
  const normLogins   = Math.min(loginCount    / 60, 1) * 100;
  const normCheckins = Math.min(vibeCheckIns  / 30, 1) * 100;
  const score = +(normStreak * 0.40 + normVibe * 0.35 + normLogins * 0.15 + normCheckins * 0.10).toFixed(1);
  const tier  = ENGAGEMENT_TIERS.find(t => score >= t.min && score <= t.max) || ENGAGEMENT_TIERS[0];
  return { score, tier: tier.label, tierColor: tier.color };
}

// ══════════════════════════════════════════════════════════
//  INITIAL MOCK DATA
// ══════════════════════════════════════════════════════════
const INITIAL_STATE = {
  streak:              { currentStreak: 7, longestStreak: 14, totalActiveDays: 28 },
  logins:              23,           // Absolute / Direct
  journalsCompleted:   18,           // Absolute / Direct
  resourceViews:       { Anxiety: 12, Burnout: 8, Stress: 15 }, // Ratio / Direct
  checkInHistory:      [4, 3, 5, 2, 4, 5, 3],   // last 7 days (Ordinal / Direct)
  forumPosts:          [
    { id:1, category:"Anxiety",    preview:"Feeling overwhelmed with finals...", flagged:false },
    { id:2, category:"Study Tips", preview:"Pomodoro technique changed my life!", flagged:false },
    { id:3, category:"Burnout",    preview:"Can't stop doom-scrolling at 2am",    flagged:false },
  ],
};

// ══════════════════════════════════════════════════════════
//  STYLED PRIMITIVES
// ══════════════════════════════════════════════════════════
const styles = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#0d0f1a",
    color: "#e8eaf0",
    minHeight: "100vh",
    padding: "0 0 60px 0",
  },
  header: {
    background: "linear-gradient(135deg, #1a1d2e 0%, #12162b 100%)",
    borderBottom: "1px solid #2a2d40",
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  logo: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" },
  accent: { color: "#7b8cff" },
  nav: {
    display: "flex",
    gap: 4,
    marginLeft: "auto",
  },
  navBtn: (active) => ({
    padding: "8px 18px",
    borderRadius: 20,
    border: "none",
    background: active ? "#7b8cff22" : "transparent",
    color: active ? "#7b8cff" : "#8890a8",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    transition: "all 0.2s",
  }),
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gap: 24,
  },
  card: {
    background: "#161929",
    border: "1px solid #222540",
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#5a5f7a",
    marginBottom: 16,
  },
  scaleTag: (color) => ({
    display: "inline-block",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    padding: "2px 7px",
    borderRadius: 4,
    background: color + "22",
    color,
    textTransform: "uppercase",
    marginLeft: 8,
    verticalAlign: "middle",
  }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 },
  number: { fontSize: 48, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 },
  subtext: { fontSize: 13, color: "#5a5f7a", marginTop: 4 },
  bar: (pct, color) => ({
    height: 6,
    background: "#222540",
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
    marginTop: 8,
  }),
  barFill: (pct, color) => ({
    height: "100%",
    width: `${pct}%`,
    background: color,
    borderRadius: 3,
    transition: "width 0.8s cubic-bezier(.34,1.56,.64,1)",
  }),
  emojiBtn: (selected, color) => ({
    fontSize: 36,
    padding: "12px 14px",
    background: selected ? color + "33" : "#1e2235",
    border: `2px solid ${selected ? color : "#2a2d40"}`,
    borderRadius: 14,
    cursor: "pointer",
    transform: selected ? "scale(1.15)" : "scale(1)",
    transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  }),
  emojiLabel: { fontSize: 10, color: "#8890a8", fontWeight: 600 },
  btn: (color = "#7b8cff") => ({
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 24px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  }),
  input: {
    width: "100%",
    background: "#1e2235",
    border: "1px solid #2a2d40",
    borderRadius: 10,
    color: "#e8eaf0",
    padding: "11px 14px",
    fontSize: 13,
    marginTop: 8,
    boxSizing: "border-box",
  },
  pill: (color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    background: color + "22",
    color: color,
    fontSize: 11,
    fontWeight: 700,
  }),
  toast: {
    position: "fixed",
    bottom: 32,
    right: 32,
    background: "#1e2235",
    border: "1px solid #2a2d40",
    borderRadius: 12,
    padding: "14px 20px",
    fontSize: 13,
    boxShadow: "0 8px 30px #0008",
    zIndex: 999,
    maxWidth: 340,
  },
  validOk:  { color: "#5ec4b1", fontWeight: 700 },
  validErr: { color: "#ff6b8a", fontWeight: 700 },
};

// ══════════════════════════════════════════════════════════
//  MINI CHART: 7-day mood sparkline
// ══════════════════════════════════════════════════════════
function MoodSparkline({ history }) {
  const W = 260, H = 60, pad = 8;
  const n = history.length;
  const pts = history.map((v, i) => {
    const x = pad + (i / (n - 1)) * (W - pad * 2);
    const y = H - pad - ((v - 1) / 4) * (H - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const fill = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")
    + ` L${pts[n-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7b8cff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7b8cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sparkGrad)" />
      <path d={d} fill="none" stroke="#7b8cff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="#7b8cff" stroke="#161929" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  CIRCULAR PROGRESS
// ══════════════════════════════════════════════════════════
function CircularScore({ value, color, size = 90 }) {
  const r = (size - 12) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash  = (value / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222540" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
        strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.34,1.56,.64,1)" }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#e8eaf0" fontSize={size / 4.5} fontWeight={800}>{value}%</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [state, setState] = useState(INITIAL_STATE);

  // Daily Vibe state
  const [selectedMood, setSelectedMood] = useState(null);
  const [validationMsg, setValidationMsg] = useState(null);
  const [toast, setToast] = useState(null);

  // Forum state
  const [newPost, setNewPost] = useState({ category: "Anxiety", content: "" });

  // Computed health score
  const avgVibe = state.checkInHistory.reduce((a, b) => a + b, 0) / state.checkInHistory.length;
  const hs = computeHealthScore({
    streakDays:   state.streak.currentStreak,
    vibeCheckIns: state.journalsCompleted,
    avgVibeScore: avgVibe,
    loginCount:   state.logins,
  });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleVibeSubmit = () => {
    if (!selectedMood) { showToast("Select a mood first!", false); return; }
    const result = validateCheckIn({ moodValue: selectedMood.value, moodLabel: selectedMood.label });
    setValidationMsg(result);
    if (result.valid) {
      setState(prev => {
        const newHistory = [...prev.checkInHistory.slice(-6), selectedMood.value];
        return {
          ...prev,
          checkInHistory: newHistory,
          journalsCompleted: prev.journalsCompleted + 1,
          streak: {
            ...prev.streak,
            currentStreak: prev.streak.currentStreak + 1,
            longestStreak: Math.max(prev.streak.longestStreak, prev.streak.currentStreak + 1),
            totalActiveDays: prev.streak.totalActiveDays + 1,
          },
        };
      });
      showToast(`✅ Vibe logged! "${selectedMood.label}" (φ=${selectedMood.value}) saved.`);
      setSelectedMood(null);
    } else {
      showToast(`❌ Validation error: ${result.error}`, false);
    }
  };

  const handlePostSubmit = () => {
    if (!newPost.content.trim()) { showToast("Write something first!", false); return; }
    const post = {
      id: Date.now(), category: newPost.category,
      preview: newPost.content.slice(0, 60) + (newPost.content.length > 60 ? "…" : ""),
      flagged: false,
    };
    setState(prev => ({ ...prev, forumPosts: [post, ...prev.forumPosts] }));
    setNewPost({ category: "Anxiety", content: "" });
    showToast("Post submitted anonymously to Support Circle.");
  };

  // ── CATEGORY COLORS (Nominal — just visual, no ordering) ──
  const catColor = (c) => {
    const map = {
      Anxiety:"#ff6b8a", Depression:"#c17dff", Stress:"#ff9a6c",
      Burnout:"#ffd166", "Study Tips":"#5ec4b1", Relationships:"#7b8cff",
      "General Wellness":"#a8d8a8",
    };
    return map[c] || "#8890a8";
  };

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>
          mind<span style={styles.accent}>flow</span>
        </div>
        <div style={{ fontSize: 12, color: "#5a5f7a", marginLeft: 4 }}>
          Student Mental Health · Measurement Theory App
        </div>
        <nav style={styles.nav}>
          {["dashboard", "vibe", "forum", "scores"].map(t => (
            <button key={t} style={styles.navBtn(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div style={styles.main}>

        {/* ── DASHBOARD ─────────────────────────────────── */}
        {tab === "dashboard" && (
          <>
            <div style={{ marginBottom: -8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Your Dashboard</h2>
              <p style={{ margin: "6px 0 0", color: "#5a5f7a", fontSize: 13 }}>
                All metrics grounded in Measurement Theory · Scale types shown inline
              </p>
            </div>

            {/* Row 1: Stats */}
            <div style={styles.grid3}>
              {[
                { label:"Current Streak", value: state.streak.currentStreak, unit:"days",
                  scale:"Ratio", scaleColor:"#5ec4b1",
                  note:"True zero = no streak. 14 days is 2× 7 days." },
                { label:"Total Logins", value: state.logins, unit:"sessions",
                  scale:"Absolute", scaleColor:"#7b8cff",
                  note:"Direct measurement. Count with true zero." },
                { label:"Journals Done", value: state.journalsCompleted, unit:"entries",
                  scale:"Absolute", scaleColor:"#7b8cff",
                  note:"Direct measurement. Each entry = +1." },
              ].map(({ label, value, unit, scale, scaleColor, note }) => (
                <div key={label} style={styles.card}>
                  <div style={styles.cardTitle}>
                    {label}
                    <span style={styles.scaleTag(scaleColor)}>{scale}</span>
                  </div>
                  <div style={styles.number}>{value}</div>
                  <div style={styles.subtext}>{unit}</div>
                  <div style={{ ...styles.bar(), marginTop: 12 }}>
                    <div style={styles.barFill(Math.min((value / 30) * 100, 100), scaleColor)} />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#3e4257" }}>{note}</div>
                </div>
              ))}
            </div>

            {/* Row 2: Mood sparkline + Streak rings */}
            <div style={styles.grid2}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  7-Day Mood History
                  <span style={styles.scaleTag("#ffd166")}>Ordinal</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <MoodSparkline history={state.checkInHistory} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {state.checkInHistory.map((v, i) => {
                    const item = VIBE_SCALE[v - 1];
                    return (
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ fontSize: 18 }}>{item.emoji}</div>
                        <div style={{ fontSize: 9, color:"#5a5f7a" }}>
                          {["M","T","W","T","F","S","S"][i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color:"#3e4257" }}>
                  Average: <strong style={{ color:"#ffd166" }}>{avgVibe.toFixed(1)}</strong> / 5
                  · Order preserved; numeric distance is NOT meaningful (Ordinal)
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  Streak Details
                  <span style={styles.scaleTag("#5ec4b1")}>Ratio · Direct</span>
                </div>
                <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                  <CircularScore
                    value={Math.round((state.streak.currentStreak / state.streak.longestStreak) * 100)}
                    color="#5ec4b1"
                  />
                  <div>
                    <div>
                      <div style={styles.subtext}>Current</div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {state.streak.currentStreak} <span style={{ fontSize:14, color:"#5a5f7a" }}>days</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={styles.subtext}>Longest ever</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color:"#5ec4b1" }}>
                        {state.streak.longestStreak} <span style={{ fontSize:12, color:"#5a5f7a" }}>days</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color:"#3e4257" }}>
                  Total active days: {state.streak.totalActiveDays} · Ratio scale: 0 = no activity. 
                  All arithmetic valid (× ÷ + −).
                </div>
              </div>
            </div>

            {/* Row 3: Resource views (Ratio) */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Resource Hub · View Counts
                <span style={styles.scaleTag("#5ec4b1")}>Ratio · Direct</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(state.resourceViews).map(([cat, views]) => (
                  <div key={cat}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13 }}>
                        <span style={styles.pill(catColor(cat))}>{cat}</span>
                        <span style={{ ...styles.scaleTag("#8890a8"), marginLeft: 4 }}>Nominal</span>
                      </span>
                      <span style={{ fontSize:13, fontWeight:700 }}>{views} views</span>
                    </div>
                    <div style={styles.bar()}>
                      <div style={styles.barFill((views / 20) * 100, catColor(cat))} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color:"#3e4257" }}>
                View count has a true zero. 12 views = 2× 6 views (multiplication meaningful).
                Category label = Nominal (no order between topics).
              </div>
            </div>
          </>
        )}

        {/* ── DAILY VIBE CHECK-IN ───────────────────────── */}
        {tab === "vibe" && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              Daily Vibe Check-In
              <span style={styles.scaleTag("#ffd166")}>Ordinal Scale</span>
            </div>
            <p style={{ color:"#8890a8", fontSize:13, marginTop:0 }}>
              <strong style={{ color:"#e8eaf0" }}>Empirical → Formal mapping:</strong>{" "}
              Your real emotional state (entity) is mapped to a number φ ∈ {"{1,2,3,4,5}"}.
              The mapping preserves order: Terrible (1) &lt; Neutral (3) &lt; Great (5).
              Distances between values are <em>not</em> numerically meaningful.
            </p>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
              {VIBE_SCALE.map(item => (
                <button
                  key={item.value}
                  style={styles.emojiBtn(selectedMood?.value === item.value, item.color)}
                  onClick={() => {
                    setSelectedMood(item);
                    setValidationMsg(null);
                  }}
                >
                  <span>{item.emoji}</span>
                  <span style={styles.emojiLabel}>{item.label}</span>
                  <span style={{ fontSize: 9, color: "#5a5f7a" }}>φ={item.value}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <div style={{
                background:"#1e2235", borderRadius:12, padding:"14px 16px",
                marginBottom:16, fontSize:13, borderLeft:`3px solid ${selectedMood.color}`
              }}>
                <strong>Selected:</strong> {selectedMood.emoji} {selectedMood.label}{" "}
                → Formal value <strong style={{ color: selectedMood.color }}>φ = {selectedMood.value}</strong>
                <br/>
                <span style={{ color:"#5a5f7a", fontSize:11 }}>
                  Validation check: moodLabel "{selectedMood.label}" must map to value {selectedMood.value}.
                </span>
              </div>
            )}

            {validationMsg && (
              <div style={{
                background: validationMsg.valid ? "#5ec4b122" : "#ff6b8a22",
                borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13,
                border: `1px solid ${validationMsg.valid ? "#5ec4b155" : "#ff6b8a55"}`,
              }}>
                {validationMsg.valid
                  ? <span style={styles.validOk}>✅ Formal–Empirical homomorphism satisfied. Check-in valid.</span>
                  : <span style={styles.validErr}>❌ {validationMsg.error}</span>
                }
              </div>
            )}

            <button style={styles.btn("#7b8cff")} onClick={handleVibeSubmit}>
              Log Today's Vibe
            </button>

            {/* Scale explanation panel */}
            <div style={{ marginTop:28, borderTop:"1px solid #222540", paddingTop:20 }}>
              <div style={styles.cardTitle}>Scale & Mapping Reference</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ color:"#5a5f7a", textAlign:"left" }}>
                    {["Emoji","Label","φ(mood)","Scale","Note"].map(h => (
                      <th key={h} style={{ padding:"6px 10px", borderBottom:"1px solid #222540" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VIBE_SCALE.map(item => (
                    <tr key={item.value} style={{ borderBottom:"1px solid #1a1d2e" }}>
                      <td style={{ padding:"8px 10px", fontSize:20 }}>{item.emoji}</td>
                      <td style={{ padding:"8px 10px" }}>{item.label}</td>
                      <td style={{ padding:"8px 10px", color:item.color, fontWeight:700 }}>{item.value}</td>
                      <td style={{ padding:"8px 10px" }}>
                        <span style={styles.scaleTag("#ffd166")}>Ordinal</span>
                      </td>
                      <td style={{ padding:"8px 10px", color:"#5a5f7a" }}>
                        {item.value === 1 && "Lower bound"}
                        {item.value === 3 && "Mid-point (neutral)"}
                        {item.value === 5 && "Upper bound"}
                        {item.value === 2 && "Below neutral"}
                        {item.value === 4 && "Above neutral"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUPPORT CIRCLE FORUM ──────────────────────── */}
        {tab === "forum" && (
          <>
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                New Anonymous Post
                <span style={styles.scaleTag("#ff9a6c")}>Nominal Category</span>
              </div>
              <p style={{ color:"#8890a8", fontSize:13, marginTop:0 }}>
                Categories use a <strong style={{ color:"#e8eaf0" }}>Nominal scale</strong>: 
                each is a distinct class with no inherent ordering.
                "Anxiety" is not greater or less than "Study Tips" — they are simply different.
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                {SUPPORT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                    style={{
                      padding:"6px 14px", borderRadius:20, border:"none",
                      background: newPost.category === cat ? catColor(cat) + "33" : "#1e2235",
                      color: newPost.category === cat ? catColor(cat) : "#8890a8",
                      cursor:"pointer", fontSize:12, fontWeight: newPost.category === cat ? 700 : 400,
                      border: `1px solid ${newPost.category === cat ? catColor(cat) + "66" : "#2a2d40"}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <textarea
                style={{ ...styles.input, height:80, resize:"vertical" }}
                placeholder="Share anonymously... (safety filters active)"
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
              />
              <div style={{ marginTop:12 }}>
                <button style={styles.btn("#5ec4b1")} onClick={handlePostSubmit}>
                  Post Anonymously
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Support Circle Posts</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {state.forumPosts.map(post => (
                  <div key={post.id} style={{
                    background:"#1e2235", borderRadius:12, padding:"14px 16px",
                    borderLeft:`3px solid ${catColor(post.category)}`,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={styles.pill(catColor(post.category))}>{post.category}</span>
                      <span style={styles.scaleTag("#ff9a6c")}>Nominal</span>
                      {post.flagged && <span style={styles.pill("#ff6b8a")}>🚩 Flagged</span>}
                    </div>
                    <div style={{ fontSize:13, color:"#c8cad8" }}>{post.preview}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── HEALTH SCORES (Indirect Measurement) ───────── */}
        {tab === "scores" && (
          <>
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Health Score · User Engagement
                <span style={styles.scaleTag("#c17dff")}>Indirect Measurement · Interval Scale</span>
              </div>
              <p style={{ color:"#8890a8", fontSize:13, marginTop:0 }}>
                This is an <strong style={{ color:"#e8eaf0" }}>indirect measurement</strong>: 
                it is derived by combining multiple direct measurements. 
                The result is on an <strong style={{ color:"#e8eaf0" }}>Interval scale</strong> 
                (zero does not mean "no health" — it is an arbitrary lower bound).
              </p>

              <div style={{ display:"flex", alignItems:"center", gap:32, marginBottom:24 }}>
                <CircularScore value={Math.round(hs.score)} color={hs.tierColor} size={110} />
                <div>
                  <div style={{ fontSize:36, fontWeight:800, lineHeight:1 }}>
                    {hs.score}
                    <span style={{ fontSize:16, color:"#5a5f7a", fontWeight:400 }}> / 100</span>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <span style={styles.pill(hs.tierColor)}>{hs.tier} Engagement</span>
                    <span style={styles.scaleTag("#ffd166")}>Ordinal Tier</span>
                  </div>
                  <div style={{ marginTop:8, fontSize:12, color:"#5a5f7a" }}>
                    Formula: 0.40×streak + 0.35×vibeAvg + 0.15×logins + 0.10×checkIns
                    (all normalised to [0,100] first)
                  </div>
                </div>
              </div>

              {/* Input breakdown */}
              <div style={{ borderTop:"1px solid #222540", paddingTop:16 }}>
                <div style={styles.cardTitle}>Direct Measurement Inputs</div>
                <div style={styles.grid2}>
                  {[
                    { label:"Streak Days",       value: state.streak.currentStreak, max:30,  scale:"Ratio",    sc:"#5ec4b1", type:"Direct", note:"Consecutive days of activity" },
                    { label:"Avg Vibe Score",     value: avgVibe.toFixed(2),         max:5,   scale:"Ordinal",  sc:"#ffd166", type:"Direct (aggregated)", note:"Mean of mood ordinal values" },
                    { label:"Logins (Direct)",    value: state.logins,               max:60,  scale:"Absolute", sc:"#7b8cff", type:"Direct", note:"Total authentication events" },
                    { label:"Check-ins (Direct)", value: state.journalsCompleted,    max:30,  scale:"Absolute", sc:"#7b8cff", type:"Direct", note:"Journals + vibe entries" },
                  ].map(({ label, value, max, scale, sc, type, note }) => (
                    <div key={label} style={{ background:"#1e2235", borderRadius:12, padding:16 }}>
                      <div style={{ fontSize:11, color:"#5a5f7a", marginBottom:4 }}>
                        {label}
                        <span style={styles.scaleTag(sc)}>{scale}</span>
                        <span style={{ ...styles.scaleTag("#4a4d66"), marginLeft:4 }}>{type}</span>
                      </div>
                      <div style={{ fontSize:24, fontWeight:800 }}>{value}</div>
                      <div style={styles.bar()}>
                        <div style={styles.barFill(Math.min((parseFloat(value) / max) * 100, 100), sc)} />
                      </div>
                      <div style={{ marginTop:6, fontSize:11, color:"#3e4257" }}>{note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Measurement theory explainer */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Measurement Theory Summary</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12, fontSize:13 }}>
                {[
                  { scale:"Nominal", color:"#ff9a6c", where:"Support Circle categories",
                    rule:"Classes only. No ordering. 'Anxiety' ≠ 'Stress' but neither is greater." },
                  { scale:"Ordinal", color:"#ffd166", where:"Daily Vibe emojis (1–5)",
                    rule:"Order preserved: Sad(1) < Neutral(3) < Happy(5). Gap sizes NOT meaningful." },
                  { scale:"Interval", color:"#c17dff", where:"Health Score (indirect composite)",
                    rule:"Differences meaningful. Zero is arbitrary (not 'no health'). Ratios invalid." },
                  { scale:"Ratio", color:"#5ec4b1", where:"Streak days, timestamps",
                    rule:"True zero exists. All operations valid: 14 days = 2× 7 days." },
                  { scale:"Absolute", color:"#7b8cff", where:"Login count, journal count, view count",
                    rule:"Counting scale. Unique unit. No arbitrary choices. 0 = truly none." },
                ].map(({ scale, color, where, rule }) => (
                  <div key={scale} style={{
                    background:"#1e2235", borderRadius:10, padding:"12px 16px",
                    borderLeft:`3px solid ${color}`,
                  }}>
                    <div style={{ display:"flex", gap:8, marginBottom:4 }}>
                      <span style={styles.pill(color)}>{scale}</span>
                      <span style={{ color:"#8890a8" }}>→ {where}</span>
                    </div>
                    <div style={{ color:"#c8cad8" }}>{rule}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          ...styles.toast,
          borderColor: toast.ok ? "#5ec4b155" : "#ff6b8a55",
          color: toast.ok ? "#e8eaf0" : "#ff6b8a",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
