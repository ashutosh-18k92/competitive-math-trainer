import { useState, useEffect, useRef, useCallback } from "react";
import "./AdditionGame.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function rand2() {
  return Math.floor(Math.random() * 90) + 10; // 10–99
}

function generateNumbers() {
  return Array.from({ length: 8 }, rand2);
}

const COUNT = 8; // numbers on the circle

/* ─── Circle geometry ─────────────────────────────────────────────────────── */
const CX = 200; // SVG viewBox centre x
const CY = 200; // SVG viewBox centre y
const R  = 148; // radius to node centres

function nodePos(index) {
  // 0 = top, clockwise
  const angle = (index / COUNT) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
  };
}

/* ─── Curved arrow path between two nodes ─────────────────────────────────── */
function arrowPath(fromIdx, toIdx) {
  const from = nodePos(fromIdx);
  const to   = nodePos(toIdx);

  // Pull the control point inward a bit so the curve arcs nicely
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // perpendicular, scaled
  const cpx = mx - dy * 0.22;
  const cpy = my + dx * 0.22;

  // Shorten from/to so the line doesn't overlap the node circles (r=22)
  const NODE_R = 22;
  const shorten = (ax, ay, bx, by, amount) => {
    const len = Math.hypot(bx - ax, by - ay);
    const ratio = amount / len;
    return { x: ax + (bx - ax) * ratio, y: ay + (by - ay) * ratio };
  };

  const src  = shorten(from.x, from.y, cpx, cpy, NODE_R);
  const dst  = shorten(to.x,   to.y,   cpx, cpy, NODE_R);

  return `M ${src.x} ${src.y} Q ${cpx} ${cpy} ${dst.x} ${dst.y}`;
}

/* ─── Pulse ring (correct flash) ─────────────────────────────────────────── */
function PulseRing({ pos, color }) {
  return (
    <circle
      cx={pos.x} cy={pos.y} r={26}
      fill="none"
      stroke={color}
      strokeWidth={2}
      opacity={0.6}
      className="ag-pulse"
    />
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function AdditionGame({ onBack }) {
  const [nums,      setNums]      = useState(generateNumbers);
  const [step,      setStep]      = useState(0);      // current pair index (0–7)
  const [ans,       setAns]       = useState("");
  const [feedback,  setFeedback]  = useState(null);   // null | "correct" | "wrong"
  const [shake,     setShake]     = useState(false);
  const [pulse,     setPulse]     = useState(false);
  const [score,     setScore]     = useState(0);
  const [mistakes,  setMistakes]  = useState(0);
  const [done,      setDone]      = useState(false);
  const [t0,        setT0]        = useState(Date.now);
  const [elapsed,   setElapsed]   = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  const inputRef = useRef(null);

  // Focus input on mount and each step
  useEffect(() => { inputRef.current?.focus(); }, [step]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const fromIdx = step % COUNT;
  const toIdx   = (step + 1) % COUNT;
  const correctAns = nums[fromIdx] + nums[toIdx];

  const submit = useCallback(() => {
    if (feedback || !ans.trim()) return;
    const val = parseInt(ans, 10);

    if (val === correctAns) {
      // Correct
      setPulse(true);
      setFeedback("correct");
      setScore(s => s + 1);
      setTimeout(() => {
        setPulse(false);
        setFeedback(null);
        setAns("");
        if (step + 1 >= COUNT) {
          // Completed full circle
          setDone(true);
          setTimerRunning(false);
        } else {
          setStep(s => s + 1);
        }
      }, 600);
    } else {
      // Wrong
      setShake(true);
      setFeedback("wrong");
      setMistakes(m => m + 1);
      setTimeout(() => {
        setShake(false);
        setFeedback(null);
        setAns("");
        inputRef.current?.focus();
      }, 700);
    }
  }, [ans, correctAns, feedback, step]);

  // Auto-submit when correct value is typed
  useEffect(() => {
    if (!ans.trim() || feedback) return;
    if (parseInt(ans, 10) === correctAns) submit();
  }, [ans]);  // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setNums(generateNumbers());
    setStep(0); setAns(""); setFeedback(null);
    setShake(false); setPulse(false);
    setScore(0); setMistakes(0); setDone(false);
    setElapsed(0); setTimerRunning(true);
  }

  const fromPos = nodePos(fromIdx);
  const toPos   = nodePos(toIdx);
  const pathD   = arrowPath(fromIdx, toIdx);

  /* ── Game-Over screen ────────────────────────────────────────────────────── */
  if (done) {
    const perfect = mistakes === 0;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = mins > 0
      ? `${mins}m ${secs}s`
      : `${secs}s`;

    return (
      <div className="ag-screen ag-done">
        <div className="ag-done__inner">
          <div className={`ag-done__badge ${perfect ? "ag-done__badge--gold" : "ag-done__badge--blue"}`}>
            {perfect ? "🌟" : "✓"}
          </div>
          <h2 className="ag-done__title">Circle Complete!</h2>
          <p className="ag-done__sub">
            {perfect
              ? "Flawless round — no mistakes!"
              : `${mistakes} mistake${mistakes > 1 ? "s" : ""} along the way.`}
          </p>

          <div className="ag-done__stats">
            <div className="ag-done__stat">
              <div className="ag-done__stat-val" style={{ color: "#4ADE80" }}>{score}/{COUNT}</div>
              <div className="ag-done__stat-label">First-try correct</div>
            </div>
            <div className="ag-done__stat">
              <div className="ag-done__stat-val" style={{ color: "#38BDF8" }}>{timeStr}</div>
              <div className="ag-done__stat-label">Total time</div>
            </div>
            <div className="ag-done__stat">
              <div className="ag-done__stat-val" style={{ color: "#F87171" }}>{mistakes}</div>
              <div className="ag-done__stat-label">Mistakes</div>
            </div>
          </div>

          <div className="ag-done__actions">
            <button className="ag-done__btn ag-done__btn--primary" onClick={restart}>
              Play Again ↺
            </button>
            <button className="ag-done__btn ag-done__btn--ghost" onClick={onBack}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Active game ─────────────────────────────────────────────────────────── */
  return (
    <div className="ag-screen ag-game">

      {/* Top bar */}
      <div className="ag-topbar">
        <button className="ag-back-btn" onClick={onBack}>← Back</button>
        <div className="ag-topbar__center">
          <span className="ag-topbar__title">Addition Circle</span>
          <span className="ag-topbar__step">{step + 1} / {COUNT}</span>
        </div>
        <div className="ag-topbar__right">
          <span className="ag-timer">{Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}</span>
          {mistakes > 0 && (
            <span className="ag-mistakes">{mistakes} ✗</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="ag-progress">
        <div
          className="ag-progress__fill"
          style={{ width: `${(step / COUNT) * 100}%` }}
        />
      </div>

      {/* Circle SVG */}
      <div className="ag-circle-wrap">
        <svg
          className="ag-svg"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dashed ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1C1C38" strokeWidth={1.5} strokeDasharray="6 5" />

          {/* Arrow */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#EF4444" />
            </marker>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2.2}
            markerEnd="url(#arrowhead)"
            className="ag-arrow"
          />

          {/* Pulse ring on source node when correct */}
          {pulse && <PulseRing pos={fromPos} color="#4ADE80" />}

          {/* Number nodes */}
          {nums.map((num, i) => {
            const pos    = nodePos(i);
            const isFrom = i === fromIdx;
            const isTo   = i === toIdx;
            const isDone = i < fromIdx;

            return (
              <g key={i} className="ag-node">
                <circle
                  cx={pos.x} cy={pos.y} r={22}
                  className={`ag-node__circle ${isFrom ? "ag-node__circle--from" : isTo ? "ag-node__circle--to" : isDone ? "ag-node__circle--done" : ""}`}
                />
                <text
                  x={pos.x} y={pos.y + 1}
                  className={`ag-node__text ${isFrom ? "ag-node__text--from" : isTo ? "ag-node__text--to" : ""}`}
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  {num}
                </text>
              </g>
            );
          })}

          {/* Centre question box */}
          <rect x={CX - 32} y={CY - 28} width={64} height={56} rx={10}
            className="ag-center-box"
          />
          <text x={CX} y={CY - 9} className="ag-center__sum-label" textAnchor="middle">
            {nums[fromIdx]} + {nums[toIdx]}
          </text>
          <text x={CX} y={CY + 14} className="ag-center__equals" textAnchor="middle">= ?</text>
        </svg>
      </div>

      {/* Input area */}
      <div className="ag-input-area">
        <div className={`ag-input-wrap ${shake ? "ag-shake" : ""}`}>
          <input
            ref={inputRef}
            type="number"
            value={ans}
            onChange={e => {
              if (feedback) return;
              setAns(e.target.value);
            }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Sum?"
            disabled={!!feedback}
            className={`ag-input ${feedback === "correct" ? "ag-input--correct" : feedback === "wrong" ? "ag-input--wrong" : ""}`}
            aria-label="Enter the sum of the two highlighted numbers"
          />
          <button
            className="ag-submit-btn"
            onClick={submit}
            disabled={!!feedback || !ans.trim()}
          >
            ✓
          </button>
        </div>

        {/* Feedback line */}
        <div className={`ag-feedback ${feedback ? "ag-feedback--visible" : ""}`}
          style={{ color: feedback === "correct" ? "#4ADE80" : "#F87171" }}
        >
          {feedback === "correct" && "✓ Correct!"}
          {feedback === "wrong"   && `✗ Expected ${correctAns}`}
        </div>

        {/* Current task label */}
        {!feedback && (
          <p className="ag-task-label">
            Add the <span className="ag-task-label--from">red source</span> → <span className="ag-task-label--to">red target</span>
          </p>
        )}
      </div>
    </div>
  );
}
