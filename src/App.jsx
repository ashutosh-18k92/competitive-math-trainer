import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ─── Trick Definitions ───────────────────────────────────────────────────── */
const TRICKS = [
  {
    id: "times11",
    name: "× 11 Rule",
    short: "×11",
    accent: "#F7B731",
    tagline: "Split · Sum · Insert",
    rule: "For any AB × 11 — write A, insert the sum (A+B) in the middle, write B. If A+B ≥ 10, carry the 1 left.",
    steps: ["Identify the two digits A and B", "Compute A + B", "Arrange: A | (A+B) | B — carry if ≥ 10"],
    examples: [
      { q: "23 × 11", step: "2 | 2+3=5 | 3", a: "253" },
      { q: "47 × 11", step: "4 | 4+7=11 → carry | 7", a: "517" },
      { q: "86 × 11", step: "8 | 8+6=14 → carry | 6", a: "946" },
    ],
    generate() {
      const n = rand(10, 99);
      return { expr: `${n} × 11`, a: n, b: 11, ans: n * 11, trickId: this.id };
    },
    getHint(q) {
      const a = Math.floor(q.a / 10), b = q.a % 10, sum = a + b;
      if (sum < 10) return `${a} | ${a}+${b}=${sum} | ${b}  →  ${q.ans}`;
      return `${a} | ${a}+${b}=${sum}≥10 carry  →  ${a+1} | ${sum-10} | ${b}  →  ${q.ans}`;
    },
  },
  {
    id: "sq5",
    name: "Square of _5",
    short: "_5²",
    accent: "#38BDF8",
    tagline: "n×(n+1), then append 25",
    rule: "For any number ending in 5 — multiply its tens digit n by (n+1), then stick '25' at the end.",
    steps: ["Take the tens digit n", "Compute n × (n+1)", "Append '25' — that's your answer"],
    examples: [
      { q: "35²", step: "3 × 4 = 12  →  12|25", a: "1225" },
      { q: "75²", step: "7 × 8 = 56  →  56|25", a: "5625" },
      { q: "55²", step: "5 × 6 = 30  →  30|25", a: "3025" },
    ],
    generate() {
      const n = rand(1, 9) * 10 + 5;
      return { expr: `${n}²`, a: n, b: n, ans: n * n, trickId: this.id };
    },
    getHint(q) {
      const n = Math.floor(q.a / 10);
      return `${n} × ${n+1} = ${n*(n+1)}  →  append 25  →  ${q.ans}`;
    },
  },
  {
    id: "teens",
    name: "Teen × Teen",
    short: "1X·1Y",
    accent: "#4ADE80",
    tagline: "100 + 10(a+b) + a·b",
    rule: "For (10+a)(10+b): always starts at 100, add 10×(sum of units), add product of units.",
    steps: ["Extract units a and b", "100 + 10×(a+b) + a×b", "Add all three parts"],
    examples: [
      { q: "13 × 17", step: "100 + 10×10 + 3×7 = 100+100+21", a: "221" },
      { q: "16 × 18", step: "100 + 10×14 + 6×8 = 100+140+48", a: "288" },
      { q: "14 × 19", step: "100 + 10×13 + 4×9 = 100+130+36", a: "266" },
    ],
    generate() {
      const a = rand(13, 19), b = rand(13, 19);
      return { expr: `${a} × ${b}`, a, b, ans: a * b, trickId: this.id };
    },
    getHint(q) {
      const [a, b] = [q.a - 10, q.b - 10];
      return `100 + 10×(${a}+${b}) + ${a}×${b}  =  100 + ${10*(a+b)} + ${a*b}  =  ${q.ans}`;
    },
  },
  {
    id: "near100",
    name: "Near 100",
    short: "≈100",
    accent: "#F472B6",
    tagline: "Deficit method — lightning fast",
    rule: "Find each number's shortfall from 100 (d1 & d2). Cross-subtract, multiply deficits. Done.",
    steps: ["d1 = 100−A,  d2 = 100−B", "Base = A−d2  (same as B−d1)", "Product = d1 × d2", "Answer = Base×100 + Product"],
    examples: [
      { q: "96 × 97", step: "d=4,3 → 93×100 + 12", a: "9312" },
      { q: "94 × 98", step: "d=6,2 → 92×100 + 12", a: "9212" },
      { q: "93 × 95", step: "d=7,5 → 88×100 + 35", a: "8835" },
    ],
    generate() {
      const a = rand(91, 99), b = rand(91, 99);
      return { expr: `${a} × ${b}`, a, b, ans: a * b, trickId: this.id };
    },
    getHint(q) {
      const [d1, d2] = [100 - q.a, 100 - q.b];
      return `d1=${d1}, d2=${d2}  →  ${q.a-d2}×100 + ${d1*d2}  =  ${q.ans}`;
    },
  },
  {
    id: "diffSq",
    name: "Diff of Squares",
    short: "a²−b²",
    accent: "#C084FC",
    tagline: "(m+d)(m−d) = m² − d²",
    rule: "When two numbers sit equally either side of a round number, use the identity (m+d)(m−d) = m²−d².",
    steps: ["Find round midpoint m", "Find distance d from each to m", "Compute m² − d²"],
    examples: [
      { q: "47 × 53", step: "mid=50, d=3 → 2500−9", a: "2491" },
      { q: "38 × 42", step: "mid=40, d=2 → 1600−4", a: "1596" },
      { q: "24 × 26", step: "mid=25, d=1 → 625−1", a: "624" },
    ],
    generate() {
      const bases = [20, 25, 30, 40, 50, 60, 70, 75, 80];
      const m = bases[rand(0, bases.length - 1)];
      const d = rand(1, 5);
      const [a, b] = [m - d, m + d];
      if (a < 11 || b > 99) return TRICKS.find(t => t.id === "diffSq").generate();
      return { expr: `${a} × ${b}`, a, b, ans: a * b, meta: { m, d }, trickId: this.id };
    },
    getHint(q) {
      const m = q.meta?.m || Math.round((q.a + q.b) / 2);
      const d = m - q.a;
      return `mid=${m}, d=${d}  →  ${m}²−${d}²  =  ${m*m}−${d*d}  =  ${q.ans}`;
    },
  },
  {
    id: "times25",
    name: "× 25 Trick",
    short: "×25",
    accent: "#FB923C",
    tagline: "Divide by 4, shift two zeros",
    rule: "Since 25 = 100÷4, multiplying by 25 means divide by 4 then multiply by 100 (append 00).",
    steps: ["Divide n by 4", "Multiply by 100 (append two zeros)"],
    examples: [
      { q: "48 × 25", step: "48÷4 = 12  →  1200", a: "1200" },
      { q: "36 × 25", step: "36÷4 = 9   →  900", a: "900" },
      { q: "64 × 25", step: "64÷4 = 16  →  1600", a: "1600" },
    ],
    generate() {
      const n = rand(11, 39) * 2;
      return { expr: `${n} × 25`, a: n, b: 25, ans: n * 25, trickId: this.id };
    },
    getHint(q) {
      return `${q.a} ÷ 4 = ${q.a / 4}  →  × 100  =  ${q.ans}`;
    },
  },
];

const TOTAL_Q = 10;

/* ─── Keyframe injection ──────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080812; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:none } }
  @keyframes pulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
  @keyframes shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  @keyframes pop      { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(247,183,49,0)} 50%{box-shadow:0 0 20px 4px rgba(247,183,49,0.18)} }
  ::selection { background: rgba(247,183,49,0.3); }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type=number] { -moz-appearance: textfield; }
  ::-webkit-scrollbar { width:6px } ::-webkit-scrollbar-track { background:#0E0E1A } ::-webkit-scrollbar-thumb { background:#2A2A42; border-radius:3px }
`;

/* ─── Tiny components ─────────────────────────────────────────────────────── */
function Badge({ color, children }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      background: color + "20", border: `1px solid ${color}55`,
      color, fontSize: 11, fontFamily: "'Outfit',sans-serif",
      fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase"
    }}>{children}</span>
  );
}

function Dot({ filled, accent }) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%",
      background: filled ? accent : "#1E1E38",
      border: `1.5px solid ${filled ? accent : "#2A2A44"}`,
      display: "inline-block", transition: "all 0.3s",
      boxShadow: filled ? `0 0 6px ${accent}99` : "none"
    }} />
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("home");       // home | learn | practice | summary
  const [learnTrick, setLearnTrick] = useState(null); // trick obj shown in learn
  const [activeTrick, setActiveTrick] = useState(null); // id | "all"
  const [q, setQ] = useState(null);
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState(null);     // null | "correct" | "wrong"
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [qNum, setQNum] = useState(0);
  const [results, setResults] = useState([]);
  const [t0, setT0] = useState(null);
  const inputRef = useRef(null);

  const getTrick = (id) => TRICKS.find(t => t.id === id);
  const currentTrickObj = q ? getTrick(q.trickId) : null;

  const genQ = useCallback((trickId) => {
    const pool = (!trickId || trickId === "all") ? TRICKS : TRICKS.filter(t => t.id === trickId);
    const trick = pool[Math.floor(Math.random() * pool.length)];
    return trick.generate();
  }, []);

  const startSession = (trickId) => {
    setActiveTrick(trickId);
    setScore(0); setStreak(0); setBest(0); setQNum(0); setResults([]);
    const first = genQ(trickId);
    setQ(first); setAns(""); setFeedback(null);
    setShowHint(false); setHintUsed(false); setT0(Date.now());
    setScreen("practice");
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const submit = () => {
    if (!ans.trim() || feedback) return;
    const secs = (Date.now() - t0) / 1000;
    const correct = parseInt(ans) === q.ans;
    setFeedback(correct ? "correct" : "wrong");

    const newStreak = correct ? streak + 1 : 0;
    const newBest = Math.max(best, newStreak);
    setStreak(newStreak); setBest(newBest);

    let pts = 0;
    if (correct) {
      pts = 10 + (hintUsed ? 0 : 3) + (secs < 6 ? 5 : secs < 12 ? 2 : 0);
    }
    setScore(s => s + pts);
    const newResults = [...results, { correct, secs, hintUsed, pts, q }];
    setResults(newResults);

    setTimeout(() => {
      if (qNum + 1 >= TOTAL_Q) {
        setScreen("summary");
      } else {
        setQNum(n => n + 1);
        const next = genQ(activeTrick);
        setQ(next); setAns(""); setFeedback(null);
        setShowHint(false); setHintUsed(false); setT0(Date.now());
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, correct ? 650 : 1300);
  };

  const accent = currentTrickObj?.accent || "#F7B731";

  /* ── Home ─────────────────────────────────────────────────────────────── */
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#080812", color: "#E8E4DB", padding: "48px 24px 80px", fontFamily: "'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeUp 0.6s ease both" }}>
        <div style={{ marginBottom: 8 }}>
          <Badge color="#F7B731">UPSC Prelims · Mental Math</Badge>
        </div>
        <h1 style={{
          fontFamily: "'Fraunces',serif", fontSize: "clamp(36px,6vw,58px)",
          fontWeight: 900, lineHeight: 1.1, marginBottom: 12,
          background: "linear-gradient(135deg,#F7B731,#FB923C)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Two-Digit<br />Speed Trainer
        </h1>
        <p style={{ color: "#7A7690", fontSize: 17, maxWidth: 480, lineHeight: 1.6 }}>
          Master proven mental math shortcuts. Each trick turns a hard problem into a 3-second calculation.
        </p>
      </div>

      {/* Trick Grid */}
      <div style={{ maxWidth: 720, margin: "40px auto 0" }}>
        <p style={{ color: "#4A4760", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
          Choose a technique
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
          {TRICKS.map((trick, i) => (
            <div key={trick.id}
              onClick={() => { setLearnTrick(trick); setScreen("learn"); }}
              style={{
                background: "#0D0D1C", border: `1px solid #1C1C30`,
                borderRadius: 14, padding: "20px 20px 18px", cursor: "pointer",
                animation: `fadeUp 0.5s ${0.07 * i}s ease both`,
                transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = trick.accent + "66";
                e.currentTarget.style.boxShadow = `0 8px 32px ${trick.accent}18`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.borderColor = "#1C1C30";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 500,
                color: trick.accent, marginBottom: 10, letterSpacing: "-0.5px"
              }}>{trick.short}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#DDD8CF", marginBottom: 6 }}>{trick.name}</div>
              <div style={{ fontSize: 12, color: "#5A5570", lineHeight: 1.5 }}>{trick.tagline}</div>
            </div>
          ))}

          {/* All Tricks card */}
          <div
            onClick={() => startSession("all")}
            style={{
              background: "linear-gradient(135deg,#13111F,#0F1020)",
              border: "1px solid #2A2840",
              borderRadius: 14, padding: "20px 20px 18px", cursor: "pointer",
              gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 18,
              animation: `fadeUp 0.5s 0.5s ease both`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(247,183,49,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ fontSize: 32, lineHeight: 1 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#F7B731", marginBottom: 4 }}>Mixed Practice — All Tricks</div>
              <div style={{ fontSize: 13, color: "#5A5570" }}>Random questions from every category · 10 questions per session</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#3A3754", fontSize: 22 }}>→</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Learn ────────────────────────────────────────────────────────────── */
  if (screen === "learn" && learnTrick) {
    const t = learnTrick;
    return (
      <div style={{ minHeight: "100vh", background: "#080812", color: "#E8E4DB", padding: "40px 24px 80px", fontFamily: "'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          <button onClick={() => setScreen("home")} style={{
            background: "none", border: "none", color: "#4A4760", cursor: "pointer",
            fontSize: 14, marginBottom: 28, display: "flex", alignItems: "center", gap: 8, padding: 0
          }}>← Back</button>

          <Badge color={t.accent}>{t.short}</Badge>
          <h2 style={{
            fontFamily: "'Fraunces',serif", fontSize: 38, fontWeight: 900,
            color: "#E8E4DB", margin: "12px 0 6px", lineHeight: 1.15
          }}>{t.name}</h2>
          <p style={{ color: "#6B6880", fontSize: 15, marginBottom: 32 }}>{t.tagline}</p>

          {/* Rule box */}
          <div style={{
            background: t.accent + "0D", border: `1px solid ${t.accent}33`,
            borderRadius: 12, padding: "20px 24px", marginBottom: 24,
            borderLeft: `3px solid ${t.accent}`
          }}>
            <div style={{ color: t.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>The Rule</div>
            <p style={{ color: "#CCC8BF", fontSize: 15, lineHeight: 1.6 }}>{t.rule}</p>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 28 }}>
            {t.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                padding: "10px 0", borderBottom: "1px solid #131326",
                animation: `slideIn 0.4s ${0.1 * i + 0.2}s both`
              }}>
                <span style={{
                  minWidth: 24, height: 24, borderRadius: "50%",
                  background: t.accent + "20", color: t.accent,
                  fontFamily: "'DM Mono',monospace", fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500
                }}>{i + 1}</span>
                <span style={{ color: "#AAA5A0", fontSize: 15, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Examples */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ color: "#3A3754", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Worked Examples</p>
            {t.examples.map((ex, i) => (
              <div key={i} style={{
                background: "#0D0D1C", border: "1px solid #1A1A30",
                borderRadius: 10, padding: "14px 18px", marginBottom: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                animation: `fadeUp 0.4s ${0.1 * i + 0.3}s both`
              }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: "#E8E4DB", marginBottom: 4 }}>{ex.q}</div>
                  <div style={{ fontSize: 13, color: "#5A5570" }}>{ex.step}</div>
                </div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 500,
                  color: t.accent, background: t.accent + "15",
                  padding: "6px 14px", borderRadius: 8
                }}>{ex.a}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => startSession(t.id)}
            style={{
              width: "100%", padding: "16px 24px", borderRadius: 12, border: "none",
              background: t.accent, color: "#08080F",
              fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.03em",
              transition: "transform 0.15s, opacity 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Start Practice — {TOTAL_Q} Questions →
          </button>
        </div>
      </div>
    );
  }

  /* ── Practice ─────────────────────────────────────────────────────────── */
  if (screen === "practice" && q) {
    const tObj = getTrick(q.trickId);
    const acc = tObj?.accent || "#F7B731";
    const isCorrect = feedback === "correct";
    const isWrong = feedback === "wrong";

    return (
      <div style={{
        minHeight: "100vh", background: "#080812", color: "#E8E4DB",
        display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif"
      }}>
        <style>{CSS}</style>

        {/* Top bar */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #111122",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setScreen("home")} style={{
              background: "none", border: "none", color: "#3A3754",
              cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0
            }}>×</button>
            <Badge color={acc}>{tObj?.name || "Mixed"}</Badge>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: TOTAL_Q }, (_, i) => (
              <Dot key={i} filled={i <= qNum} accent={acc} />
            ))}
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 14,
            color: acc, background: acc + "18", padding: "5px 12px", borderRadius: 8
          }}>
            {score} pts
          </div>
        </div>

        {/* Main area */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "24px"
        }}>

          {/* Q counter + streak */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32, alignItems: "center" }}>
            <span style={{ color: "#3A3754", fontSize: 14 }}>Q {qNum + 1} / {TOTAL_Q}</span>
            {streak >= 2 && (
              <span style={{
                color: acc, fontSize: 13, fontWeight: 600,
                animation: "pulse 1s infinite"
              }}>🔥 {streak} streak</span>
            )}
          </div>

          {/* Question display */}
          <div style={{
            textAlign: "center", marginBottom: 48,
            animation: isWrong ? "shake 0.5s ease" : isCorrect ? "pop 0.4s ease" : "fadeUp 0.4s ease",
          }}>
            <div style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "clamp(40px,10vw,72px)",
              fontWeight: 500, letterSpacing: "-2px",
              color: isCorrect ? "#4ADE80" : isWrong ? "#F87171" : "#E8E4DB",
              transition: "color 0.2s",
              lineHeight: 1.1
            }}>
              {q.expr}
            </div>
            <div style={{ color: "#2A2742", fontSize: 15, marginTop: 10 }}>= ?</div>
          </div>

          {/* Input */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input
              ref={inputRef}
              type="number"
              value={ans}
              onChange={e => !feedback && setAns(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Your answer"
              disabled={!!feedback}
              style={{
                width: 240, padding: "18px 24px", borderRadius: 14,
                border: `2px solid ${feedback === "correct" ? "#4ADE80" : feedback === "wrong" ? "#F87171" : "#1E1E38"}`,
                background: "#0D0D1C",
                fontFamily: "'DM Mono',monospace", fontSize: 24,
                color: "#E8E4DB", textAlign: "center", outline: "none",
                transition: "border-color 0.25s",
              }}
            />
          </div>

          {/* Feedback line */}
          {feedback && (
            <div style={{
              marginBottom: 20, fontSize: 15, fontWeight: 600, textAlign: "center",
              color: isCorrect ? "#4ADE80" : "#F87171",
              animation: "fadeUp 0.3s ease"
            }}>
              {isCorrect ? "✓ Correct!" : `✗ The answer was ${q.ans}`}
              {isCorrect && !hintUsed && <span style={{ color: "#F7B731", marginLeft: 8 }}>+3 no-hint bonus</span>}
            </div>
          )}

          {/* Submit / Hint */}
          {!feedback && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={submit}
                disabled={!ans.trim()}
                style={{
                  padding: "12px 32px", borderRadius: 10, border: "none",
                  background: ans.trim() ? acc : "#1A1A2E",
                  color: ans.trim() ? "#080812" : "#3A3754",
                  fontWeight: 700, fontSize: 15, cursor: ans.trim() ? "pointer" : "default",
                  transition: "all 0.2s", fontFamily: "'Outfit',sans-serif"
                }}
              >Submit</button>
              <button
                onClick={() => { setShowHint(true); setHintUsed(true); }}
                style={{
                  padding: "12px 20px", borderRadius: 10,
                  border: "1px solid #1E1E38", background: "none",
                  color: "#4A4760", fontSize: 14, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", transition: "border-color 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#3A3754"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1E1E38"}
              >💡 Hint</button>
            </div>
          )}

          {/* Hint box */}
          {showHint && tObj && (
            <div style={{
              marginTop: 28, maxWidth: 440, padding: "14px 20px",
              background: acc + "0C", border: `1px solid ${acc}33`,
              borderRadius: 10, fontFamily: "'DM Mono',monospace",
              fontSize: 14, color: "#B8B4AC", lineHeight: 1.7,
              animation: "fadeUp 0.3s ease"
            }}>
              <span style={{ color: acc, fontWeight: 500 }}>Trick: </span>
              {tObj.getHint(q)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Summary ──────────────────────────────────────────────────────────── */
  if (screen === "summary") {
    const correct = results.filter(r => r.correct).length;
    const avgTime = results.reduce((s, r) => s + r.secs, 0) / results.length;
    const maxPossible = TOTAL_Q * 18;
    const pct = Math.round((score / maxPossible) * 100);
    const grade = pct >= 90 ? "S" : pct >= 75 ? "A" : pct >= 55 ? "B" : pct >= 35 ? "C" : "D";
    const gradeColor = { S: "#F7B731", A: "#4ADE80", B: "#38BDF8", C: "#FB923C", D: "#F87171" }[grade];

    return (
      <div style={{ minHeight: "100vh", background: "#080812", color: "#E8E4DB", padding: "48px 24px 80px", fontFamily: "'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.5s ease" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: gradeColor + "18", border: `2px solid ${gradeColor}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: gradeColor
            }}>{grade}</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Session Complete</h2>
            <p style={{ color: "#5A5570", fontSize: 16 }}>
              {pct >= 75 ? "Strong performance! Keep it up." : pct >= 50 ? "Good effort — practice makes perfect." : "Keep drilling — speed will come."}
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Score", val: `${score}`, sub: `/ ${maxPossible} possible`, color: "#F7B731" },
              { label: "Correct", val: `${correct}/${TOTAL_Q}`, sub: `${Math.round(correct/TOTAL_Q*100)}% accuracy`, color: "#4ADE80" },
              { label: "Best Streak", val: `${best}`, sub: "consecutive correct", color: "#C084FC" },
              { label: "Avg Time", val: `${avgTime.toFixed(1)}s`, sub: "per question", color: "#38BDF8" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "#0D0D1C", border: "1px solid #1A1A30", borderRadius: 12,
                padding: "18px 20px", animation: `fadeUp 0.4s ${0.1*i+0.2}s both`
              }}>
                <div style={{ color: "#4A4760", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, fontWeight: 500, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "#3A3754", marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Per-question breakdown */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ color: "#3A3754", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Question Breakdown</p>
            {results.map((r, i) => {
              const t = getTrick(r.q.trickId);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: "1px solid #0E0E1C",
                  animation: `slideIn 0.35s ${0.05*i+0.3}s both`
                }}>
                  <span style={{ color: r.correct ? "#4ADE80" : "#F87171", fontSize: 16 }}>{r.correct ? "✓" : "✗"}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: "#AAA5A0", flex: 1 }}>{r.q.expr}</span>
                  <span style={{ fontSize: 13, color: "#3A3754" }}>{t?.name}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#4A4760" }}>{r.secs.toFixed(1)}s</span>
                  {r.hintUsed && <span style={{ fontSize: 11, color: "#4A4760" }}>hint</span>}
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 13,
                    color: r.pts > 0 ? "#F7B731" : "#3A3754"
                  }}>+{r.pts}</span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => startSession(activeTrick)}
              style={{
                flex: 1, padding: "14px", borderRadius: 12, border: "none",
                background: "#F7B731", color: "#080812",
                fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Outfit',sans-serif"
              }}>
              Try Again ↺
            </button>
            <button
              onClick={() => setScreen("home")}
              style={{
                flex: 1, padding: "14px", borderRadius: 12,
                border: "1px solid #1E1E38", background: "none",
                color: "#7A7690", fontSize: 15, cursor: "pointer", fontFamily: "'Outfit',sans-serif"
              }}>
              Choose Trick
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
