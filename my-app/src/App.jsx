import { useState } from "react";

// ═══════════════════════════════════════════════════════
//  MEASUREMENT THEORY CONSTANTS
// ═══════════════════════════════════════════════════════
const VIBE_SCALE = [
  { value: 1, label: "Terrible", emoji: "😢", color: "#ff6b8a" },
  { value: 2, label: "Down",     emoji: "😞", color: "#ff9a6c" },
  { value: 3, label: "Neutral",  emoji: "😐", color: "#ffd166" },
  { value: 4, label: "Good",     emoji: "🙂", color: "#a8d8a8" },
  { value: 5, label: "Great",    emoji: "😄", color: "#5ec4b1" },
];

const SUPPORT_CATEGORIES = [
  "Anxiety","Depression","Stress","Burnout","Study Tips","Relationships","General Wellness",
];

const ENGAGEMENT_TIERS = [
  { label: "Low",       min: 0,  max: 25,  color: "#ff6b8a" },
  { label: "Moderate",  min: 26, max: 50,  color: "#ffd166" },
  { label: "High",      min: 51, max: 75,  color: "#a8d8a8" },
  { label: "Excellent", min: 76, max: 100, color: "#5ec4b1" },
];

function validateCheckIn({ moodValue, moodLabel }) {
  const canonical = VIBE_SCALE.find(v => v.label === moodLabel);
  if (!canonical) return { valid: false, error: `Unknown mood label: "${moodLabel}"` };
  if (canonical.value !== moodValue)
    return { valid: false, error: `Homomorphism violation: "${moodLabel}" should map to ${canonical.value}, got ${moodValue}` };
  if (moodValue < 1 || moodValue > 5)
    return { valid: false, error: `Ordinal out of range [1-5]: ${moodValue}` };
  return { valid: true, error: null };
}

function computeHealthScore({ streakDays, vibeCheckIns, avgVibeScore, loginCount }) {
  const normStreak   = Math.min(streakDays   / 30, 1) * 100;
  const normVibe     = ((avgVibeScore - 1) / 4) * 100;
  const normLogins   = Math.min(loginCount   / 60, 1) * 100;
  const normCheckins = Math.min(vibeCheckIns / 30, 1) * 100;
  const score = +(normStreak * 0.40 + normVibe * 0.35 + normLogins * 0.15 + normCheckins * 0.10).toFixed(1);
  const tier  = ENGAGEMENT_TIERS.find(t => score >= t.min && score <= t.max) || ENGAGEMENT_TIERS[0];
  return { score, tier: tier.label, tierColor: tier.color };
}

const INITIAL_STATE = {
  streak:            { currentStreak: 7, longestStreak: 14, totalActiveDays: 28 },
  logins:            23,
  journalsCompleted: 18,
  resourceViews:     { Anxiety: 12, Burnout: 8, Stress: 15 },
  checkInHistory:    [4, 3, 5, 2, 4, 5, 3],
  forumPosts: [
    { id:1, category:"Anxiety",    preview:"Feeling overwhelmed with finals...", flagged:false },
    { id:2, category:"Study Tips", preview:"Pomodoro technique changed my life!", flagged:false },
    { id:3, category:"Burnout",    preview:"Can't stop doom-scrolling at 2am",    flagged:false },
  ],
};

const catColor = (c) => ({
  Anxiety:"#ff6b8a", Depression:"#c17dff", Stress:"#ff9a6c",
  Burnout:"#ffd166", "Study Tips":"#5ec4b1", Relationships:"#7b8cff",
  "General Wellness":"#a8d8a8",
}[c] || "#8890a8");

// ══════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ══════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100%; }
  body { background: #0d0f1a; color: #e8eaf0; font-family: 'DM Sans','Segoe UI',sans-serif; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0d0f1a; }
  ::-webkit-scrollbar-thumb { background: #2a2d40; border-radius: 3px; }

  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .g3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .g4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }

  @media (max-width: 900px) {
    .g3 { grid-template-columns: repeat(2,1fr); }
    .g4 { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width: 580px) {
    .g2,.g3,.g4 { grid-template-columns: 1fr; }
    .hide-sm { display: none !important; }
    .nav-lbl { display: none; }
  }

  .card { background:#161929; border:1px solid #222540; border-radius:16px; padding:18px; width:100%; }
  .sec-title { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#5a5f7a; margin-bottom:12px; }
  .stag { display:inline-block; font-size:9px; font-weight:700; letter-spacing:0.1em; padding:2px 6px; border-radius:4px; text-transform:uppercase; margin-left:6px; vertical-align:middle; }
  .pill { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .bar-t { height:6px; background:#222540; border-radius:3px; overflow:hidden; margin-top:8px; }
  .bar-f { height:100%; border-radius:3px; transition: width 0.8s cubic-bezier(.34,1.56,.64,1); }

  .nav-btn { padding:8px 16px; border-radius:20px; border:none; background:transparent; color:#8890a8; cursor:pointer; font-size:13px; font-weight:400; transition:all 0.2s; white-space:nowrap; }
  .nav-btn:hover { color:#c0c4d8; }
  .nav-btn.on { background:#7b8cff22; color:#7b8cff; font-weight:700; }

  .emoji-btn { display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 8px; border-radius:14px; border:2px solid #2a2d40; background:#1e2235; cursor:pointer; transition:all 0.2s cubic-bezier(.34,1.56,.64,1); flex:1; min-width:0; }
  .emoji-btn:hover { transform:scale(1.05); }
  .emoji-btn.sel { transform:scale(1.1); }

  .btn { border:none; border-radius:10px; padding:11px 24px; font-size:13px; font-weight:700; cursor:pointer; color:#fff; transition:opacity 0.2s; font-family:inherit; }
  .btn:hover { opacity:0.85; }

  .textarea { width:100%; background:#1e2235; border:1px solid #2a2d40; border-radius:10px; color:#e8eaf0; padding:11px 14px; font-size:13px; margin-top:8px; font-family:inherit; resize:vertical; min-height:80px; }
  .cat-btn { padding:6px 13px; border-radius:20px; cursor:pointer; font-size:12px; transition:all 0.15s; font-family:inherit; }

  .toast { position:fixed; bottom:24px; right:24px; background:#1e2235; border:1px solid #2a2d40; border-radius:12px; padding:14px 18px; font-size:13px; box-shadow:0 8px 30px #0008; z-index:999; max-width:320px; animation:su 0.3s ease; }
  @keyframes su { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .mt { border-collapse:collapse; width:100%; font-size:12px; }
  .mt th { color:#5a5f7a; text-align:left; padding:6px 10px; border-bottom:1px solid #222540; }
  .mt td { padding:8px 10px; border-bottom:1px solid #1a1d2e; }
`;

// ── Sub-components ──────────────────────────────────────
function ScaleTag({ color, label }) {
  return <span className="stag" style={{ background:color+"22", color }}>{label}</span>;
}
function Pill({ color, children }) {
  return <span className="pill" style={{ background:color+"22", color }}>{children}</span>;
}
function Bar({ pct, color }) {
  return (
    <div className="bar-t">
      <div className="bar-f" style={{ width:`${Math.min(pct,100)}%`, background:color }} />
    </div>
  );
}

function Sparkline({ history }) {
  const H = 60, pad = 8, n = history.length;
  const pts = history.map((v,i) => [
    pad + (i/(n-1))*(300-pad*2),
    H - pad - ((v-1)/4)*(H-pad*2),
  ]);
  const d = pts.map((p,i) => `${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const fill = d + ` L${pts[n-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 300 ${H}`} style={{ width:"100%", height:H }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7b8cff" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#7b8cff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sg)"/>
      <path d={d} fill="none" stroke="#7b8cff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y],i) => <circle key={i} cx={x} cy={y} r={4} fill="#7b8cff" stroke="#161929" strokeWidth={2}/>)}
    </svg>
  );
}

function Ring({ value, color, size=88 }) {
  const r=(size-12)/2, cx=size/2, cy=size/2;
  const c=2*Math.PI*r, dash=(value/100)*c;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222540" strokeWidth={8}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition:"stroke-dasharray 1s cubic-bezier(.34,1.56,.64,1)" }}
      />
      <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
        fill="#e8eaf0" fontSize={size/4.5} fontWeight={800}>{value}%</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [state, setState]     = useState(INITIAL_STATE);
  const [mood, setMood]       = useState(null);
  const [valMsg, setValMsg]   = useState(null);
  const [toast, setToast]     = useState(null);
  const [post, setPost]       = useState({ category:"Anxiety", content:"" });

  const avg = state.checkInHistory.reduce((a,b)=>a+b,0) / state.checkInHistory.length;
  const hs  = computeHealthScore({
    streakDays:   state.streak.currentStreak,
    vibeCheckIns: state.journalsCompleted,
    avgVibeScore: avg,
    loginCount:   state.logins,
  });

  const toast$ = (msg, ok=true) => {
    setToast({msg,ok});
    setTimeout(()=>setToast(null), 3500);
  };

  const logVibe = () => {
    if (!mood) { toast$("Select a mood first!", false); return; }
    const r = validateCheckIn({ moodValue:mood.value, moodLabel:mood.label });
    setValMsg(r);
    if (r.valid) {
      setState(p => ({
        ...p,
        checkInHistory: [...p.checkInHistory.slice(-6), mood.value],
        journalsCompleted: p.journalsCompleted + 1,
        streak: {
          ...p.streak,
          currentStreak: p.streak.currentStreak + 1,
          longestStreak: Math.max(p.streak.longestStreak, p.streak.currentStreak+1),
          totalActiveDays: p.streak.totalActiveDays + 1,
        },
      }));
      toast$(`Vibe logged! "${mood.label}" (φ=${mood.value}) saved.`);
      setMood(null);
    } else {
      toast$(r.error, false);
    }
  };

  const submitPost = () => {
    if (!post.content.trim()) { toast$("Write something first!", false); return; }
    setState(p => ({
      ...p,
      forumPosts: [{
        id:Date.now(), category:post.category,
        preview:post.content.slice(0,80)+(post.content.length>80?"…":""),
        flagged:false,
      }, ...p.forumPosts],
    }));
    setPost({ category:"Anxiety", content:"" });
    toast$("Post submitted anonymously.");
  };

  const TABS = [
    { key:"dashboard", icon:"📊", label:"Dashboard" },
    { key:"vibe",      icon:"😊", label:"Vibe" },
    { key:"forum",     icon:"💬", label:"Forum" },
    { key:"scores",    icon:"📈", label:"Scores" },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", width:"100%" }}>

        {/* HEADER */}
        <header style={{
          background:"linear-gradient(135deg,#1a1d2e,#12162b)",
          borderBottom:"1px solid #2a2d40",
          padding:"0 20px", height:54,
          display:"flex", alignItems:"center", gap:10, flexShrink:0,
        }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", whiteSpace:"nowrap" }}>
            mind<span style={{ color:"#7b8cff" }}>flow</span>
          </div>
          <div className="hide-sm" style={{ fontSize:11, color:"#5a5f7a" }}>
            Student Mental Health · Measurement Theory
          </div>
          <nav style={{ display:"flex", gap:2, marginLeft:"auto" }}>
            {TABS.map(({ key, icon, label }) => (
              <button key={key} className={`nav-btn${tab===key?" on":""}`} onClick={()=>setTab(key)}>
                {icon} <span className="nav-lbl">{label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* CONTENT */}
        <main style={{ flex:1, padding:"18px 18px 40px", display:"flex", flexDirection:"column", gap:16, width:"100%" }}>

          {/* ── DASHBOARD ── */}
          {tab==="dashboard" && <>
            <div>
              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>Your Dashboard</h2>
              <p style={{ color:"#5a5f7a", fontSize:12 }}>Measurement Theory scale types shown inline on each metric</p>
            </div>

            <div className="g3">
              {[
                { label:"Current Streak", value:state.streak.currentStreak, unit:"days",     scale:"Ratio",    sc:"#5ec4b1", note:"True zero; 14d = 2×7d" },
                { label:"Total Logins",   value:state.logins,               unit:"sessions", scale:"Absolute", sc:"#7b8cff", note:"Direct count; true zero" },
                { label:"Journals Done",  value:state.journalsCompleted,    unit:"entries",  scale:"Absolute", sc:"#ff9a6c", note:"Each entry = +1" },
              ].map(({ label, value, unit, scale, sc, note }) => (
                <div className="card" key={label}>
                  <div className="sec-title">{label}<ScaleTag color={sc} label={scale}/></div>
                  <div style={{ fontSize:40, fontWeight:800, letterSpacing:"-2px", lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:12, color:"#5a5f7a", marginTop:3 }}>{unit}</div>
                  <Bar pct={(value/30)*100} color={sc}/>
                  <div style={{ marginTop:9, fontSize:11, color:"#3e4257" }}>{note}</div>
                </div>
              ))}
            </div>

            <div className="g2">
              <div className="card">
                <div className="sec-title">7-Day Mood History<ScaleTag color="#ffd166" label="Ordinal"/></div>
                <Sparkline history={state.checkInHistory}/>
                <div style={{ display:"flex", gap:4, marginTop:10, justifyContent:"space-between" }}>
                  {state.checkInHistory.map((v,i) => {
                    const item = VIBE_SCALE[v-1];
                    return (
                      <div key={i} style={{ textAlign:"center", flex:1 }}>
                        <div style={{ fontSize:16 }}>{item.emoji}</div>
                        <div style={{ fontSize:9, color:"#5a5f7a" }}>{["M","T","W","T","F","S","S"][i]}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:8, fontSize:11, color:"#3e4257" }}>
                  Avg: <strong style={{ color:"#ffd166" }}>{avg.toFixed(1)}</strong>/5 · Order preserved; distance NOT meaningful
                </div>
              </div>

              <div className="card">
                <div className="sec-title">Streak Details<ScaleTag color="#5ec4b1" label="Ratio · Direct"/></div>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <Ring value={Math.round((state.streak.currentStreak/state.streak.longestStreak)*100)} color="#5ec4b1"/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#5a5f7a" }}>Current</div>
                    <div style={{ fontSize:28, fontWeight:800 }}>{state.streak.currentStreak}<span style={{ fontSize:12, color:"#5a5f7a" }}> days</span></div>
                    <div style={{ marginTop:8, fontSize:11, color:"#5a5f7a" }}>Longest ever</div>
                    <div style={{ fontSize:20, fontWeight:700, color:"#5ec4b1" }}>{state.streak.longestStreak}<span style={{ fontSize:11, color:"#5a5f7a" }}> days</span></div>
                  </div>
                </div>
                <div style={{ marginTop:10, fontSize:11, color:"#3e4257", lineHeight:1.4 }}>
                  Total active days: {state.streak.totalActiveDays} · All arithmetic valid (×÷+−)
                </div>
              </div>
            </div>

            <div className="card">
              <div className="sec-title">Resource Hub · View Counts<ScaleTag color="#5ec4b1" label="Ratio · Direct"/></div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(state.resourceViews).map(([cat, views]) => (
                  <div key={cat}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, alignItems:"center" }}>
                      <span><Pill color={catColor(cat)}>{cat}</Pill><ScaleTag color="#8890a8" label="Nominal"/></span>
                      <span style={{ fontSize:13, fontWeight:700 }}>{views} views</span>
                    </div>
                    <Bar pct={(views/20)*100} color={catColor(cat)}/>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:11, color:"#3e4257" }}>
                View count = Ratio (true zero). Category = Nominal (no ordering between topics).
              </div>
            </div>
          </>}

          {/* ── VIBE ── */}
          {tab==="vibe" && <>
            <div className="card">
              <div className="sec-title">Daily Vibe Check-In<ScaleTag color="#ffd166" label="Ordinal Scale"/></div>
              <p style={{ color:"#8890a8", fontSize:13, lineHeight:1.6, marginBottom:18 }}>
                <strong style={{ color:"#e8eaf0" }}>Empirical → Formal mapping:</strong> Your emotional state maps to φ ∈ {"{1,2,3,4,5}"}. Order preserved: Terrible(1) &lt; Neutral(3) &lt; Great(5). Distances between values are <em>not</em> numerically meaningful.
              </p>
              <div style={{ display:"flex", gap:10, marginBottom:18 }}>
                {VIBE_SCALE.map(item => (
                  <button key={item.value}
                    className={`emoji-btn${mood?.value===item.value?" sel":""}`}
                    style={{ background:mood?.value===item.value?item.color+"33":"#1e2235", borderColor:mood?.value===item.value?item.color:"#2a2d40" }}
                    onClick={()=>{ setMood(item); setValMsg(null); }}
                  >
                    <span style={{ fontSize:30 }}>{item.emoji}</span>
                    <span style={{ fontSize:10, color:"#8890a8", fontWeight:600 }}>{item.label}</span>
                    <span style={{ fontSize:9, color:"#5a5f7a" }}>φ={item.value}</span>
                  </button>
                ))}
              </div>
              {mood && (
                <div style={{ background:"#1e2235", borderRadius:12, padding:"12px 16px", marginBottom:12, fontSize:13, borderLeft:`3px solid ${mood.color}`, lineHeight:1.5 }}>
                  <strong>Selected:</strong> {mood.emoji} {mood.label} → Formal value <strong style={{ color:mood.color }}>φ = {mood.value}</strong><br/>
                  <span style={{ color:"#5a5f7a", fontSize:11 }}>Validation: "{mood.label}" must map to value {mood.value}.</span>
                </div>
              )}
              {valMsg && (
                <div style={{ background:valMsg.valid?"#5ec4b122":"#ff6b8a22", borderRadius:10, padding:"12px 16px", marginBottom:14, fontSize:13, border:`1px solid ${valMsg.valid?"#5ec4b155":"#ff6b8a55"}` }}>
                  {valMsg.valid
                    ? <span style={{ color:"#5ec4b1", fontWeight:700 }}>✅ Formal–Empirical homomorphism satisfied. Valid.</span>
                    : <span style={{ color:"#ff6b8a", fontWeight:700 }}>❌ {valMsg.error}</span>
                  }
                </div>
              )}
              <button className="btn" style={{ background:"#7b8cff" }} onClick={logVibe}>Log Today's Vibe</button>
            </div>

            <div className="card">
              <div className="sec-title">Scale &amp; Mapping Reference</div>
              <div style={{ overflowX:"auto" }}>
                <table className="mt">
                  <thead><tr>{["Emoji","Label","φ(mood)","Scale","Note"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {VIBE_SCALE.map(item => (
                      <tr key={item.value}>
                        <td style={{ fontSize:20 }}>{item.emoji}</td>
                        <td>{item.label}</td>
                        <td><strong style={{ color:item.color }}>{item.value}</strong></td>
                        <td><ScaleTag color="#ffd166" label="Ordinal"/></td>
                        <td style={{ color:"#5a5f7a" }}>{["Lower bound","Below neutral","Mid-point","Above neutral","Upper bound"][item.value-1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>}

          {/* ── FORUM ── */}
          {tab==="forum" && <>
            <div className="card">
              <div className="sec-title">New Anonymous Post<ScaleTag color="#ff9a6c" label="Nominal Category"/></div>
              <p style={{ color:"#8890a8", fontSize:13, lineHeight:1.6, marginBottom:14 }}>
                Categories use a <strong style={{ color:"#e8eaf0" }}>Nominal scale</strong>: each is a distinct class with no inherent ordering. "Anxiety" is not greater than "Study Tips" — they are simply different classes.
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {SUPPORT_CATEGORIES.map(cat => (
                  <button key={cat} className="cat-btn"
                    style={{ background:post.category===cat?catColor(cat)+"33":"#1e2235", color:post.category===cat?catColor(cat):"#8890a8", border:`1px solid ${post.category===cat?catColor(cat)+"66":"#2a2d40"}`, fontWeight:post.category===cat?700:400 }}
                    onClick={()=>setPost(p=>({...p,category:cat}))}
                  >{cat}</button>
                ))}
              </div>
              <textarea className="textarea" placeholder="Share anonymously... (safety filters active)" value={post.content} onChange={e=>setPost(p=>({...p,content:e.target.value}))}/>
              <div style={{ marginTop:12 }}>
                <button className="btn" style={{ background:"#5ec4b1" }} onClick={submitPost}>Post Anonymously</button>
              </div>
            </div>
            <div className="card">
              <div className="sec-title">Support Circle Posts</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {state.forumPosts.map(p => (
                  <div key={p.id} style={{ background:"#1e2235", borderRadius:12, padding:"12px 16px", borderLeft:`3px solid ${catColor(p.category)}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <Pill color={catColor(p.category)}>{p.category}</Pill>
                      <ScaleTag color="#ff9a6c" label="Nominal"/>
                      {p.flagged && <Pill color="#ff6b8a">🚩 Flagged</Pill>}
                    </div>
                    <div style={{ fontSize:13, color:"#c8cad8" }}>{p.preview}</div>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ── SCORES ── */}
          {tab==="scores" && <>
            <div className="card">
              <div className="sec-title">
                Health Score · User Engagement
                <ScaleTag color="#c17dff" label="Indirect · Interval"/>
              </div>
              <p style={{ color:"#8890a8", fontSize:13, lineHeight:1.6, marginBottom:18 }}>
                <strong style={{ color:"#e8eaf0" }}>Indirect measurement</strong>: derived by combining direct measurements.
                Result is an <strong style={{ color:"#e8eaf0" }}>Interval scale</strong> — zero does not mean "no health"; it is an arbitrary lower bound.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:22, marginBottom:18, flexWrap:"wrap" }}>
                <Ring value={Math.round(hs.score)} color={hs.tierColor} size={106}/>
                <div>
                  <div style={{ fontSize:36, fontWeight:800, lineHeight:1 }}>{hs.score}<span style={{ fontSize:15, color:"#5a5f7a", fontWeight:400 }}> / 100</span></div>
                  <div style={{ marginTop:8 }}>
                    <Pill color={hs.tierColor}>{hs.tier} Engagement</Pill>
                    <ScaleTag color="#ffd166" label="Ordinal Tier"/>
                  </div>
                  <div style={{ marginTop:8, fontSize:11, color:"#5a5f7a", lineHeight:1.5 }}>
                    Formula: 0.40×streak + 0.35×vibeAvg + 0.15×logins + 0.10×checkIns<br/>
                    (all normalised to [0,100] first)
                  </div>
                </div>
              </div>

              <div style={{ borderTop:"1px solid #222540", paddingTop:14 }}>
                <div className="sec-title">Direct Measurement Inputs</div>
                <div className="g4">
                  {[
                    { label:"Streak Days",   value:state.streak.currentStreak, max:30, scale:"Ratio",    sc:"#5ec4b1", type:"Direct",              note:"Consecutive days" },
                    { label:"Avg Vibe",      value:avg.toFixed(2),             max:5,  scale:"Ordinal",  sc:"#ffd166", type:"Direct (aggregated)", note:"Mean mood value" },
                    { label:"Logins",        value:state.logins,               max:60, scale:"Absolute", sc:"#7b8cff", type:"Direct",              note:"Auth events" },
                    { label:"Check-ins",     value:state.journalsCompleted,    max:30, scale:"Absolute", sc:"#ff9a6c", type:"Direct",              note:"Journals + vibes" },
                  ].map(({ label, value, max, scale, sc, type, note }) => (
                    <div key={label} style={{ background:"#1e2235", borderRadius:12, padding:14 }}>
                      <div style={{ fontSize:11, color:"#5a5f7a", marginBottom:4 }}>
                        {label}<ScaleTag color={sc} label={scale}/>
                      </div>
                      <div style={{ fontSize:22, fontWeight:800 }}>{value}</div>
                      <Bar pct={(parseFloat(value)/max)*100} color={sc}/>
                      <div style={{ marginTop:6, fontSize:11, color:"#3e4257" }}>{type} · {note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="sec-title">Measurement Theory Summary</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, fontSize:13 }}>
                {[
                  { scale:"Nominal",  color:"#ff9a6c", where:"Support Circle categories",  rule:"Classes only. No ordering. 'Anxiety' is not > or < 'Stress'; just different." },
                  { scale:"Ordinal",  color:"#ffd166", where:"Daily Vibe emojis (1–5)",     rule:"Order preserved: Sad(1) < Neutral(3) < Happy(5). Gap sizes NOT meaningful." },
                  { scale:"Interval", color:"#c17dff", where:"Health Score (indirect)",     rule:"Differences meaningful. Zero is arbitrary (not 'no health'). Ratios invalid." },
                  { scale:"Ratio",    color:"#5ec4b1", where:"Streak days, timestamps",     rule:"True zero. All operations valid: 14 days = 2× 7 days." },
                  { scale:"Absolute", color:"#7b8cff", where:"Login count, journal count",  rule:"Counting scale. Unique unit. No arbitrary choices. 0 = truly none." },
                ].map(({ scale, color, where, rule }) => (
                  <div key={scale} style={{ background:"#1e2235", borderRadius:10, padding:"12px 16px", borderLeft:`3px solid ${color}` }}>
                    <div style={{ display:"flex", gap:8, marginBottom:4, flexWrap:"wrap", alignItems:"center" }}>
                      <Pill color={color}>{scale}</Pill>
                      <span style={{ color:"#8890a8", fontSize:12 }}>→ {where}</span>
                    </div>
                    <div style={{ color:"#c8cad8", lineHeight:1.5 }}>{rule}</div>
                  </div>
                ))}
              </div>
            </div>
          </>}

        </main>
      </div>

      {toast && (
        <div className="toast" style={{ borderColor:toast.ok?"#5ec4b155":"#ff6b8a55", color:toast.ok?"#e8eaf0":"#ff6b8a" }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}