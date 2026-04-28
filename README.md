# Competitive Math Trainer

A dark-mode, animated mental-math practice app built with **React + Vite**, targeting UPSC Prelims and competitive exam candidates who want to internalise two-digit calculation shortcuts.

---

## Features

| Module | What it does |
|---|---|
| **Two-Digit Speed Trainer** | Learn and drill 8 proven tricks (× 11, ×25, squares-5, teen×teen, near-100, diff-of-squares, squares 1–25, cubes 1–15) |
| **Scored Practice Sessions** | 10-question timed sessions with streak bonuses and a no-hint bonus |
| **Learn Mode** | Step-by-step rule explanation + worked examples before you practice |
| **Session Summary** | Grade (S/A/B/C/D), per-question breakdown, avg time, best streak |

---

## Tech Stack

- **React 19** (JSX, hooks)
- **Vite 8** — dev server & bundler
- **Vanilla CSS** with BEM class naming
- **CSS custom properties** (`index.css` `:root {}`) for the full design-token system
- Google Fonts: *Fraunces* (display), *DM Mono* (numbers), *Outfit* (body)

---

## Project Structure

```
competitive-math-trainer/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Main component + TRICKS data array
    ├── App.css           # BEM component styles (references :root tokens)
    └── index.css         # Global reset + :root{} design tokens
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
```

---

## How Tricks Work — The `TRICKS` Array

Every trick in the app is a plain JavaScript **object** inside the `TRICKS` array in `src/App.jsx`. The app is entirely data-driven: adding a new trick requires only inserting a new object into that array — no other file needs to change.

### Trick Object Schema

```js
{
  // ── Identity ─────────────────────────────────────────────────
  id:      string,   // Unique camelCase identifier, e.g. "times11"
  name:    string,   // Full display name shown in Learn and Practice headers
  short:   string,   // 3-5 char label shown on the Home grid card, e.g. "×11"
  accent:  string,   // Hex colour; used for the card highlight, badge, hint label

  // ── Teaching content ─────────────────────────────────────────
  tagline: string,   // One-line summary shown under the card name on Home
  rule:    string,   // Full rule description shown in the Learn rule-box
  steps:   string[], // Ordered list of steps shown in the Learn view
  examples: [        // Worked examples shown in the Learn view
    {
      q:    string,  // The question as written, e.g. "23 × 11"
      step: string,  // The intermediate working shown below the question
      a:    string,  // The final answer (string for display)
    },
    // ... (aim for 3 examples)
  ],

  // ── Practice engine ──────────────────────────────────────────
  generate(): Question,
  // Must return a Question object:
  // {
  //   expr:    string,   // Display string shown in the practice view, e.g. "23 × 11"
  //   a:       number,   // First operand (used by getHint)
  //   b:       number,   // Second operand (used by getHint, can equal a for squares)
  //   ans:     number,   // Correct integer answer — compared against parseInt(userInput)
  //   trickId: string,   // Must match this trick's id
  //   meta?:   object,   // Optional extra data your getHint may need
  // }

  getHint(q: Question): string,
  // Returns a human-readable hint string shown in the hint-box during practice.
  // q is the Question object produced by generate().
  // Show the mental arithmetic steps, not just the answer.
}
```

---

## Guide for AI Models — Adding a New Trick

Follow these steps precisely to add a new trick without breaking the app.

### Step 1 — Choose a unique `id`

Use camelCase, descriptive, no spaces. Check the existing `TRICKS` array for conflicts:

```
times11 | sq5 | teens | near100 | diffSq | times25 | sq1_25 | cube1_15
```

### Step 2 — Pick an `accent` colour

Each trick has a distinct accent. Existing palette:

| Trick | Accent |
|---|---|
| `times11` | `#F7B731` (gold) |
| `sq5` | `#38BDF8` (sky) |
| `teens` | `#4ADE80` (green) |
| `near100` | `#F472B6` (pink) |
| `diffSq` | `#C084FC` (purple) |
| `times25` | `#FB923C` (orange) |
| `sq1_25` | `#A78BFA` (violet) |
| `cube1_15` | `#34D399` (emerald) |

Choose a colour not already in use.

### Step 3 — Write `generate()`

- Use the local `rand(min, max)` helper (already in scope).
- Ensure `ans` is always a **safe integer** (no floats, no NaN).
- If generation can produce invalid inputs, guard with a recursive retry:

```js
generate() {
  const n = rand(10, 90);
  if (someInvalidCondition) return TRICKS.find(t => t.id === "yourId").generate();
  return { expr: `${n} ...`, a: n, b: ..., ans: ..., trickId: this.id };
},
```

### Step 4 — Write `getHint(q)`

- `q` is exactly what `generate()` returned.
- Show the **method**, not just the answer. The user already knows they got it wrong.
- Use `→` as a step separator and `q.ans` at the end:

```js
getHint(q) {
  // Good — shows the working
  return `${q.a} ÷ 4 = ${q.a / 4}  →  × 100  =  ${q.ans}`;

  // Bad — just restates the answer
  return `The answer is ${q.ans}`;
},
```

- For tricks that cover a range of numbers, branch the hint by range:

```js
getHint(q) {
  const n = q.a;
  if (n <= 10) return `${n}² = ${q.ans}  (recall)`;
  const a = n - 10;
  return `(10+${a})² = 100 + ${20*a} + ${a*a}  =  ${q.ans}`;
},
```

### Step 5 — Add the object to `TRICKS`

Open `src/App.jsx` and insert your new object inside the `TRICKS` array, after the last `},` and before the closing `];`:

```js
const TRICKS = [
  // ... existing tricks ...
  {
    id: "yourNewTrick",
    name: "Your Trick Name",
    short: "sym",
    accent: "#HEXCOL",
    tagline: "Short tagline here",
    rule: "Full rule description ...",
    steps: ["Step one", "Step two", "Step three"],
    examples: [
      { q: "A × B", step: "working ...", a: "result" },
      { q: "C × D", step: "working ...", a: "result" },
      { q: "E × F", step: "working ...", a: "result" },
    ],
    generate() {
      const n = rand(/* appropriate range */);
      return { expr: `...`, a: n, b: n, ans: n * n, trickId: this.id };
    },
    getHint(q) {
      return `... mental steps ...  =  ${q.ans}`;
    },
  },   // ← trailing comma required
];     // ← do NOT add anything after this line
```

### Step 6 — Verify

The app hot-reloads. Open the browser and confirm:

1. The new trick card appears on the Home grid with the correct `short` label and `accent` colour.
2. Clicking it opens the Learn screen with the rule, steps, and examples.
3. Starting practice generates questions — no `NaN` or `undefined` in the expression.
4. Submitting a wrong answer and clicking **💡 Hint** shows your hint text.
5. "Mixed Practice — All Tricks" includes questions from your new trick.

### Complete minimal example

```js
{
  id: "times5",
  name: "× 5 Trick",
  short: "×5",
  accent: "#FCD34D",
  tagline: "Halve and shift one zero",
  rule: "Since 5 = 10÷2, multiplying by 5 means divide by 2 then multiply by 10.",
  steps: [
    "Divide n by 2",
    "Multiply by 10 (append one zero)",
    "If n is odd, the result ends in 5",
  ],
  examples: [
    { q: "34 × 5", step: "34÷2 = 17  →  170", a: "170" },
    { q: "47 × 5", step: "47÷2 = 23.5  →  235", a: "235" },
    { q: "86 × 5", step: "86÷2 = 43  →  430", a: "430" },
  ],
  generate() {
    const n = rand(11, 99);
    return { expr: `${n} × 5`, a: n, b: 5, ans: n * 5, trickId: this.id };
  },
  getHint(q) {
    return `${q.a} ÷ 2 = ${q.a / 2}  →  × 10  =  ${q.ans}`;
  },
},
```

---

## Scoring

| Condition | Points |
|---|---|
| Correct answer | +10 |
| No hint used | +3 bonus |
| Answer in < 6 s | +5 speed bonus |
| Answer in 6–12 s | +2 speed bonus |
| Wrong answer | +0 |

Maximum per question: **18 pts** — used to compute the session percentage grade.

---

## CSS Architecture

Styles follow a two-layer system:

1. **`src/index.css`** — global CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, etc.) and a minimal base reset. **Edit this file to change the colour theme.**
2. **`src/App.css`** — BEM component styles (`block__element--modifier`) that consume the tokens via `var()`. No hardcoded hex values.

Dynamic per-trick accent colours (which cannot be expressed as static CSS) are passed as minimal inline `style` props in JSX.
