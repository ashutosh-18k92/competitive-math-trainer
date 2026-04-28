import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

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
      { q: "36 × 25", step: "36÷4 = 9   →  900",  a: "900" },
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
  {
    id: "sq1_25",
    name: "Squares 1 – 25",
    short: "n²",
    accent: "#A78BFA",
    tagline: "Singles recall · Teen expansion · Twenty expansion",
    rule: "1–10: pure recall. 11–20: (10+a)² = 100 + 20a + a². 21–25: (20+a)² = 400 + 40a + a².",
    steps: [
      "For n ≤ 10 — recall directly (1, 4, 9, 16, 25, 36, 49, 64, 81, 100)",
      "For 11–20 — write n = 10+a, then 100 + 20a + a²",
      "For 21–25 — write n = 20+a, then 400 + 40a + a²",
    ],
    examples: [
      { q: "13²", step: "10+3 → 100 + 60 + 9", a: "169" },
      { q: "17²", step: "10+7 → 100 + 140 + 49", a: "289" },
      { q: "23²", step: "20+3 → 400 + 120 + 9", a: "529" },
    ],
    generate() {
      const n = rand(1, 25);
      return { expr: `${n}²`, a: n, b: n, ans: n * n, trickId: this.id };
    },
    getHint(q) {
      const n = q.a;
      if (n <= 10) {
        return `${n} × ${n}  =  ${q.ans}  (recall)`;
      } else if (n <= 20) {
        const a = n - 10;
        return `(10+${a})² = 100 + ${20 * a} + ${a * a}  =  ${q.ans}`;
      } else {
        const a = n - 20;
        return `(20+${a})² = 400 + ${40 * a} + ${a * a}  =  ${q.ans}`;
      }
    },
  },
  {
    id: "cube1_15",
    name: "Cubes 1 – 15",
    short: "n³",
    accent: "#34D399",
    tagline: "Recall to 10 · Expand beyond",
    rule: "1–10: recall n³ directly. 11–15: use (10+a)³ = 1000 + 300a + 30a² + a³ and add up.",
    steps: [
      "For n ≤ 10 — recall: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000",
      "For 11–15 — write n = 10+a",
      "Compute 1000 + 300a + 30a² + a³ and sum the parts",
    ],
    examples: [
      { q: "12³", step: "1000 + 600 + 120 + 8", a: "1728" },
      { q: "13³", step: "1000 + 900 + 270 + 27", a: "2197" },
      { q: "15³", step: "1000 + 1500 + 750 + 125", a: "3375" },
    ],
    generate() {
      const n = rand(1, 15);
      return { expr: `${n}³`, a: n, b: n, ans: n * n * n, trickId: this.id };
    },
    getHint(q) {
      const n = q.a;
      if (n <= 10) {
        return `${n}³  =  ${q.ans}  (recall)`;
      }
      const a = n - 10;
      const t1 = 1000, t2 = 300 * a, t3 = 30 * a * a, t4 = a * a * a;
      return `(10+${a})³ = ${t1} + ${t2} + ${t3} + ${t4}  =  ${q.ans}`;
    },
  },
  {
    id: "addRound",
    name: "Round & Add",
    short: "A+B",
    accent: "#22D3EE",
    tagline: "Round up · Add · Pull back",
    rule: "Round the second number up to the nearest 10, add it, then subtract the overshoot. Eliminates carrying in your head.",
    steps: [
      "Find how much to round B up to the next multiple of 10 (overshoot d = roundUp(B) − B)",
      "Add the rounded number to A  →  A + roundUp(B)",
      "Subtract the overshoot  →  result − d",
    ],
    examples: [
      { q: "47 + 38", step: "round 38→40 (+2) → 47+40=87 → 87−2", a: "85" },
      { q: "56 + 27", step: "round 27→30 (+3) → 56+30=86 → 86−3", a: "83" },
      { q: "73 + 49", step: "round 49→50 (+1) → 73+50=123 → 123−1", a: "122" },
    ],
    generate() {
      const a = rand(11, 79);
      // Pick b so that it does NOT already end in 0 (trick would be trivial)
      let b;
      do { b = rand(11, 99 - a); } while (b % 10 === 0);
      return { expr: `${a} + ${b}`, a, b, ans: a + b, trickId: this.id };
    },
    getHint(q) {
      const rounded = Math.ceil(q.b / 10) * 10;
      const d = rounded - q.b;
      return `round ${q.b}→${rounded} (+${d})  →  ${q.a}+${rounded}=${q.a + rounded}  →  ${q.a + rounded}−${d}  =  ${q.ans}`;
    },
  },
  {
    id: "subCount",
    name: "Count-Up Subtract",
    short: "A−B",
    accent: "#FB7185",
    tagline: "Jump to 10s · Bridge · Sum gaps",
    rule: "Instead of subtracting, count UP from B to A in two jumps: first to the next multiple of 10, then the rest of the way. Add the two gaps.",
    steps: [
      "From B, count up to the next multiple of 10  →  gap₁",
      "From that multiple of 10, count up to A  →  gap₂",
      "Answer = gap₁ + gap₂",
    ],
    examples: [
      { q: "83 − 47", step: "47→50 = 3, 50→83 = 33  →  3+33", a: "36" },
      { q: "72 − 35", step: "35→40 = 5, 40→72 = 32  →  5+32", a: "37" },
      { q: "91 − 64", step: "64→70 = 6, 70→91 = 21  →  6+21", a: "27" },
    ],
    generate() {
      const b = rand(11, 88);
      const a = rand(b + 2, Math.min(b + 60, 99));
      // Ensure b is not a multiple of 10 (first jump would be trivial)
      if (b % 10 === 0) return TRICKS.find(t => t.id === "subCount").generate();
      return { expr: `${a} − ${b}`, a, b, ans: a - b, trickId: this.id };
    },
    getHint(q) {
      const nextTen = Math.ceil(q.b / 10) * 10;
      const gap1 = nextTen - q.b;
      const gap2 = q.a - nextTen;
      if (gap2 === 0) {
        // b lands exactly on a multiple of 10
        return `${q.b}→${nextTen} = ${gap1}  →  answer = ${gap1}  =  ${q.ans}`;
      }
      return `${q.b}→${nextTen} = ${gap1},  ${nextTen}→${q.a} = ${gap2}  →  ${gap1}+${gap2}  =  ${q.ans}`;
    },
  },
  {
    id: "teenTables",
    name: "Teen Tables 12–19",
    short: "12…19",
    accent: "#F59E0B",
    tagline: "Multiply · Divide by teen · Divide by digit",
    rule: "For (10+a)×b: split as 10b + a×b. Reverse: to divide a product by its teen factor, recall which single digit fits; to divide by the digit, recall which teen fits.",
    steps: [
      "Multiply: (10+a) × b  =  10b + a×b  →  add the two parts",
      "Divide by teen: product ÷ (10+a) → ask 'which digit × (10+a) = product?'",
      "Divide by digit: product ÷ digit → ask 'which teen × digit = product?'",
    ],
    examples: [
      { q: "17 × 8",    step: "10×8=80, 7×8=56  →  80+56",  a: "136" },
      { q: "136 ÷ 17",  step: "17×? = 136  →  17×8=136",    a: "8"   },
      { q: "136 ÷ 8",   step: "?×8 = 136  →  17×8=136",     a: "17"  },
    ],
    generate() {
      const teen  = rand(12, 19);          // e.g. 17
      const digit = rand(2, 9);            // e.g. 8
      const product = teen * digit;        // e.g. 136
      const mode = rand(1, 3);
      // mode 1 → multiply, mode 2 → ÷ teen, mode 3 → ÷ digit
      if (mode === 1) {
        return {
          expr: `${teen} × ${digit}`,
          a: teen, b: digit, ans: product,
          meta: { teen, digit, product, mode: 1 },
          trickId: this.id,
        };
      } else if (mode === 2) {
        return {
          expr: `${product} ÷ ${teen}`,
          a: product, b: teen, ans: digit,
          meta: { teen, digit, product, mode: 2 },
          trickId: this.id,
        };
      } else {
        return {
          expr: `${product} ÷ ${digit}`,
          a: product, b: digit, ans: teen,
          meta: { teen, digit, product, mode: 3 },
          trickId: this.id,
        };
      }
    },
    getHint(q) {
      const { teen, digit, product, mode } = q.meta;
      const a = teen - 10;   // e.g. 7 for teen=17
      if (mode === 1) {
        return `(10+${a})×${digit} = 10×${digit} + ${a}×${digit}  =  ${10*digit} + ${a*digit}  =  ${q.ans}`;
      } else if (mode === 2) {
        return `${teen} × ? = ${product}  →  10×${digit}=10×${digit}, +${a}×${digit}=${a*digit}  →  digit = ${q.ans}`;
      } else {
        return `? × ${digit} = ${product}  →  ${product}÷${digit} = ${teen}  →  check: (10+${a})×${digit}=${10*digit}+${a*digit}=${product}  →  teen = ${q.ans}`;
      }
    },
  },
];

const TOTAL_Q = 10;

/* ─── Tiny components ─────────────────────────────────────────────────────── */
function Badge({ color, children }) {
  return (
    <span
      className="badge"
      style={{
        background: color + "20",
        border: `1px solid ${color}55`,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Dot({ filled, accent }) {
  return (
    <span
      className="dot"
      style={{
        background: filled ? accent : "#1E1E38",
        border: `1.5px solid ${filled ? accent : "#2A2A44"}`,
        boxShadow: filled ? `0 0 6px ${accent}99` : "none",
      }}
    />
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("home");        // home | learn | practice | summary
  const [learnTrick, setLearnTrick] = useState(null);  // trick obj shown in learn
  const [activeTrick, setActiveTrick] = useState(null); // id | "all"
  const [q, setQ] = useState(null);
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState(null);      // null | "correct" | "wrong"
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

  const submit = (currentAns = ans) => {
    if (!currentAns.trim() || feedback) return;
    const secs = (Date.now() - t0) / 1000;
    const correct = parseInt(currentAns) === q.ans;
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
    <div className="screen home">

      {/* Header */}
      <div className="home__header">
        <div className="home__badge-wrap">
          <Badge color="#F7B731">UPSC Prelims · Mental Math</Badge>
        </div>
        <h1 className="home__title">
          Two-Digit<br />Speed Trainer
        </h1>
        <p className="home__subtitle">
          Master proven mental math shortcuts. Each trick turns a hard problem into a 3-second calculation.
        </p>
      </div>

      {/* Trick Grid */}
      <div className="home__grid-wrap">
        <p className="home__grid-label">Choose a technique</p>
        <div className="home__grid">
          {TRICKS.map((trick, i) => (
            <div
              key={trick.id}
              className="trick-card"
              onClick={() => { setLearnTrick(trick); setScreen("learn"); }}
              style={{ animation: `fadeUp 0.5s ${0.07 * i}s ease both` }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = trick.accent + "66";
                e.currentTarget.style.boxShadow = `0 8px 32px ${trick.accent}18`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="trick-card__short" style={{ color: trick.accent }}>{trick.short}</div>
              <div className="trick-card__name">{trick.name}</div>
              <div className="trick-card__tagline">{trick.tagline}</div>
            </div>
          ))}

          {/* All Tricks card */}
          <div
            className="all-tricks-card"
            onClick={() => startSession("all")}
            style={{ animation: `fadeUp 0.5s 0.5s ease both` }}
          >
            <div className="all-tricks-card__icon">⚡</div>
            <div>
              <div className="all-tricks-card__title">Mixed Practice — All Tricks</div>
              <div className="all-tricks-card__desc">Random questions from every category · 10 questions per session</div>
            </div>
            <div className="all-tricks-card__arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Learn ────────────────────────────────────────────────────────────── */
  if (screen === "learn" && learnTrick) {
    const t = learnTrick;
    return (
      <div className="screen learn">
        <div className="learn__inner">

          <button className="learn__back-btn" onClick={() => setScreen("home")}>← Back</button>

          <Badge color={t.accent}>{t.short}</Badge>
          <h2 className="learn__title">{t.name}</h2>
          <p className="learn__tagline">{t.tagline}</p>

          {/* Rule box */}
          <div
            className="learn__rule-box"
            style={{
              background: t.accent + "0D",
              border: `1px solid ${t.accent}33`,
              borderLeft: `3px solid ${t.accent}`,
            }}
          >
            <div className="learn__rule-label" style={{ color: t.accent }}>The Rule</div>
            <p className="learn__rule-text">{t.rule}</p>
          </div>

          {/* Steps */}
          <div className="learn__steps">
            {t.steps.map((step, i) => (
              <div
                key={i}
                className="learn__step"
                style={{ animation: `slideIn 0.4s ${0.1 * i + 0.2}s both` }}
              >
                <span
                  className="learn__step-num"
                  style={{ background: t.accent + "20", color: t.accent }}
                >
                  {i + 1}
                </span>
                <span className="learn__step-text">{step}</span>
              </div>
            ))}
          </div>

          {/* Examples */}
          <div className="learn__examples">
            <p className="learn__examples-label">Worked Examples</p>
            {t.examples.map((ex, i) => (
              <div
                key={i}
                className="learn__example-item"
                style={{ animation: `fadeUp 0.4s ${0.1 * i + 0.3}s both` }}
              >
                <div>
                  <div className="learn__example-expr">{ex.q}</div>
                  <div className="learn__example-step">{ex.step}</div>
                </div>
                <div
                  className="learn__example-answer"
                  style={{ color: t.accent, background: t.accent + "15" }}
                >
                  {ex.a}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            className="learn__cta-btn"
            onClick={() => startSession(t.id)}
            style={{ background: t.accent, color: "#08080F" }}
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

    const questionModifier = isWrong
      ? "practice__question--wrong"
      : isCorrect
        ? "practice__question--correct"
        : "practice__question--default";

    const exprColor = isCorrect ? "#4ADE80" : isWrong ? "#F87171" : "#E8E4DB";
    const inputBorderColor = feedback === "correct" ? "#4ADE80" : feedback === "wrong" ? "#F87171" : "#1E1E38";

    return (
      <div className="screen practice">

        {/* Top bar */}
        <div className="practice__topbar">
          <div className="practice__topbar-left">
            <button className="practice__close-btn" onClick={() => setScreen("home")}>×</button>
            <Badge color={acc}>{tObj?.name || "Mixed"}</Badge>
          </div>
          <div className="practice__dots">
            {Array.from({ length: TOTAL_Q }, (_, i) => (
              <Dot key={i} filled={i <= qNum} accent={acc} />
            ))}
          </div>
          <div
            className="practice__score-badge"
            style={{ color: acc, background: acc + "18" }}
          >
            {score} pts
          </div>
        </div>

        {/* Main area */}
        <div className="practice__main">

          {/* Q counter + streak */}
          <div className="practice__meta">
            <span className="practice__q-counter">Q {qNum + 1} / {TOTAL_Q}</span>
            {streak >= 2 && (
              <span className="practice__streak" style={{ color: acc }}>
                🔥 {streak} streak
              </span>
            )}
          </div>

          {/* Question display */}
          <div className={`practice__question ${questionModifier}`}>
            <div className="practice__expr" style={{ color: exprColor }}>
              {q.expr}
            </div>
            <div className="practice__equals">= ?</div>
          </div>

          {/* Input */}
          <div className="practice__input-wrap">
            <input
              ref={inputRef}
              type="number"
              value={ans}
              onChange={e => {
                if (feedback) return;
                const val = e.target.value;
                setAns(val);
                if (val.trim() && parseInt(val) === q.ans) submit(val);
              }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Your answer"
              disabled={!!feedback}
              className="practice__input"
              style={{ border: `2px solid ${inputBorderColor}` }}
            />
          </div>

          {/* Feedback line */}
          {feedback && (
            <div
              className="practice__feedback"
              style={{ color: isCorrect ? "#4ADE80" : "#F87171" }}
            >
              {isCorrect ? "✓ Correct!" : `✗ The answer was ${q.ans}`}
              {isCorrect && !hintUsed && (
                <span className="practice__no-hint-bonus">+3 no-hint bonus</span>
              )}
            </div>
          )}

          {/* Hint */}
          {!feedback && (
            <div className="practice__actions">
              <button
                className="practice__hint-btn"
                onClick={() => { setShowHint(true); setHintUsed(true); }}
              >
                💡 Hint
              </button>
            </div>
          )}

          {/* Hint box */}
          {showHint && tObj && (
            <div
              className="practice__hint-box"
              style={{
                background: acc + "0C",
                border: `1px solid ${acc}33`,
              }}
            >
              <span className="practice__hint-label" style={{ color: acc }}>Trick: </span>
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
      <div className="screen summary">
        <div className="summary__inner">

          <div className="summary__header">
            <div
              className="summary__grade-badge"
              style={{
                background: gradeColor + "18",
                border: `2px solid ${gradeColor}55`,
                color: gradeColor,
              }}
            >
              {grade}
            </div>
            <h2 className="summary__title">Session Complete</h2>
            <p className="summary__subtitle">
              {pct >= 75
                ? "Strong performance! Keep it up."
                : pct >= 50
                  ? "Good effort — practice makes perfect."
                  : "Keep drilling — speed will come."}
            </p>
          </div>

          {/* Stat cards */}
          <div className="summary__stats">
            {[
              { label: "Score",       val: `${score}`,               sub: `/ ${maxPossible} possible`,          color: "#F7B731" },
              { label: "Correct",     val: `${correct}/${TOTAL_Q}`,  sub: `${Math.round(correct/TOTAL_Q*100)}% accuracy`, color: "#4ADE80" },
              { label: "Best Streak", val: `${best}`,                sub: "consecutive correct",                color: "#C084FC" },
              { label: "Avg Time",    val: `${avgTime.toFixed(1)}s`, sub: "per question",                      color: "#38BDF8" },
            ].map((s, i) => (
              <div
                key={i}
                className="summary__stat-card"
                style={{ animation: `fadeUp 0.4s ${0.1 * i + 0.2}s both` }}
              >
                <div className="summary__stat-label">{s.label}</div>
                <div className="summary__stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="summary__stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Per-question breakdown */}
          <div className="summary__breakdown">
            <p className="summary__breakdown-label">Question Breakdown</p>
            {results.map((r, i) => {
              const t = getTrick(r.q.trickId);
              return (
                <div
                  key={i}
                  className="summary__breakdown-row"
                  style={{ animation: `slideIn 0.35s ${0.05 * i + 0.3}s both` }}
                >
                  <span
                    className="summary__breakdown-icon"
                    style={{ color: r.correct ? "#4ADE80" : "#F87171" }}
                  >
                    {r.correct ? "✓" : "✗"}
                  </span>
                  <span className="summary__breakdown-expr">{r.q.expr}</span>
                  <span className="summary__breakdown-trick">{t?.name}</span>
                  <span className="summary__breakdown-time">{r.secs.toFixed(1)}s</span>
                  {r.hintUsed && <span className="summary__breakdown-hint">hint</span>}
                  <span
                    className="summary__breakdown-pts"
                    style={{ color: r.pts > 0 ? "#F7B731" : "#3A3754" }}
                  >
                    +{r.pts}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="summary__actions">
            <button className="summary__retry-btn" onClick={() => startSession(activeTrick)}>
              Try Again ↺
            </button>
            <button className="summary__home-btn" onClick={() => setScreen("home")}>
              Choose Trick
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
