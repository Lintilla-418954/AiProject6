// PROTOTYPE: three variants of how buffer edits drive the Scene, switch with ?variant=A|B|C.
import { Vim } from "./vim";
import { PUZZLES, Puzzle, simulate, SimResult, World, parseLine } from "./sim";

type VariantKey = "A" | "B" | "C";
const VARIANTS: Record<VariantKey, string> = {
  A: "Ghost preview: live predicted path, robot runs on solve",
  B: "Mission console: per-line diagnostics, robot replays on every edit",
  C: "Live loop: robot re-runs the program continuously, execution pointer in buffer",
};

const params = new URLSearchParams(location.search);
const variant = (params.get("variant") ?? "A") as VariantKey;
let puzzleIdx = Number(params.get("puzzle") ?? 0);

const BLOCKED = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Insert", "Delete"]);
const RESET_KEY = "F2";
const TILE = 44;

interface Game {
  p: Puzzle;
  vim: Vim;
  sim: SimResult;
  locked: boolean;
  solved: boolean;
  hintUsed: boolean;
  nudge: string;
  anim: { frame: number; timer: number | null };
}

let g: Game;
const app = document.getElementById("app")!;

function newGame(): Game {
  const p = PUZZLES[puzzleIdx];
  const vim = new Vim(p.startText);
  return { p, vim, sim: simulate(p, vim.s.lines), locked: false, solved: false, hintUsed: false, nudge: "", anim: { frame: 0, timer: null } };
}

function stars(): number {
  const n = g.vim.s.keystrokes;
  const b = g.p.budget;
  let s = n <= b.three ? 3 : n <= b.two ? 2 : 1;
  if (g.hintUsed) s = Math.min(s, 2);
  return s;
}

function isSolved(): boolean {
  return g.vim.s.mode === "NORMAL" && g.vim.s.lines.join("\n") === g.p.targetText.join("\n");
}

// ---------- scene rendering ----------
function drawScene(canvas: HTMLCanvasElement, world: World, opts: { ghost?: SimResult; failAt?: { x: number; y: number } | null; flash?: string }) {
  const p = g.p;
  canvas.width = p.map[0].length * TILE;
  canvas.height = p.map.length * TILE;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#0b1020";
  c.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = "#ffffff22";
    c.fillRect((i * 97) % canvas.width, (i * 53) % canvas.height, 2, 2);
  }
  p.map.forEach((row, y) =>
    [...row].forEach((t, x) => {
      const px = x * TILE, py = y * TILE;
      if (t === "#") { c.fillStyle = "#3a4256"; c.fillRect(px, py, TILE, TILE); c.strokeStyle = "#555f78"; c.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6); }
      else if (t === "v") { c.fillStyle = "#05070f"; c.fillRect(px, py, TILE, TILE); }
      else { c.fillStyle = "#1c2438"; c.fillRect(px + 1, py + 1, TILE - 2, TILE - 2); }
      if (t === "P") { c.strokeStyle = "#39d98a"; c.lineWidth = 3; c.strokeRect(px + 6, py + 6, TILE - 12, TILE - 12); c.lineWidth = 1; }
      const door = Object.entries(p.doorTiles).find(([, ch]) => ch === t)?.[0];
      if (door) {
        const open = world.doors[door];
        c.fillStyle = open ? "#f5b94255" : "#f5b942";
        c.fillRect(px + (open ? 2 : 14), py + 2, open ? 6 : 16, TILE - 4);
        c.fillStyle = "#fff"; c.font = "9px monospace"; c.fillText(door[0], px + 3, py + 10);
      }
    }),
  );
  if (opts.ghost) {
    c.strokeStyle = opts.ghost.success ? "#39d98a" : "#7aa2ff";
    c.setLineDash([4, 4]); c.lineWidth = 2; c.beginPath();
    opts.ghost.frames.forEach((f, i) => {
      const cx = f.world.robot.x * TILE + TILE / 2, cy = f.world.robot.y * TILE + TILE / 2;
      i ? c.lineTo(cx, cy) : c.moveTo(cx, cy);
    });
    c.stroke(); c.setLineDash([]); c.lineWidth = 1;
  }
  if (world.crate) {
    const { x, y } = world.crate;
    c.fillStyle = "#b07a3b"; c.fillRect(x * TILE + 10, y * TILE + 10, TILE - 20, TILE - 20);
    c.strokeStyle = "#5c3d17"; c.strokeRect(x * TILE + 10, y * TILE + 10, TILE - 20, TILE - 20);
  }
  const r = world.robot;
  const rx = r.x * TILE + TILE / 2, ry = r.y * TILE + TILE / 2;
  c.fillStyle = "#d8e1f0"; c.beginPath(); c.arc(rx, ry, 13, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#22d3ee";
  const eye = { N: [0, -7], E: [7, 0], S: [0, 7], W: [-7, 0] }[r.dir];
  c.beginPath(); c.arc(rx + eye[0], ry + eye[1], 4, 0, Math.PI * 2); c.fill();
  if (opts.failAt) {
    c.strokeStyle = "#ff5c5c"; c.lineWidth = 3;
    const fx = opts.failAt.x * TILE, fy = opts.failAt.y * TILE;
    c.beginPath(); c.moveTo(fx + 8, fy + 8); c.lineTo(fx + TILE - 8, fy + TILE - 8); c.moveTo(fx + TILE - 8, fy + 8); c.lineTo(fx + 8, fy + TILE - 8); c.stroke(); c.lineWidth = 1;
  }
  if (opts.flash) {
    c.fillStyle = opts.flash; c.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ---------- buffer rendering ----------
function bufferHtml(opts: { gutter?: (i: number) => string; execLine?: number }): string {
  const s = g.vim.s;
  return s.lines
    .map((line, i) => {
      const chars = [...(line.length ? line : " ")].map((ch, ci) => {
        const cur = i === s.row && ci === s.col;
        const cls = cur ? (s.mode === "INSERT" ? "cur ins" : "cur") : "";
        return `<span class="${cls}">${ch === " " ? "&nbsp;" : ch.replace("<", "&lt;")}</span>`;
      });
      if (s.mode === "INSERT" && i === s.row && s.col >= line.length && line.length) chars.push(`<span class="cur ins">&nbsp;</span>`);
      const gut = opts.gutter ? `<span class="gut">${opts.gutter(i)}</span>` : "";
      const exec = opts.execLine === i ? " exec" : "";
      return `<div class="ln${exec}"><span class="num">${i + 1}</span>${gut}${chars.join("")}</div>`;
    })
    .join("");
}

function statusline(): string {
  const s = g.vim.s;
  const b = g.p.budget;
  const n = s.keystrokes;
  const pct = Math.min(100, (n / b.pass) * 100);
  const tier = n <= b.three ? "★★★" : n <= b.two ? "★★☆" : n <= b.pass ? "★☆☆" : "☆☆☆";
  return `<div class="status"><span class="mode ${s.mode}">-- ${s.mode} --</span><span class="pend">${g.vim.pendingKeys}</span>
    <span class="keys">${n} / ${b.pass} keys <b>${tier}</b></span>
    <div class="meter"><i style="width:${pct}%"></i><em style="left:${(b.three / b.pass) * 100}%"></em><em style="left:${(b.two / b.pass) * 100}%"></em></div></div>`;
}

function sidePanel(): string {
  const p = g.p;
  const sv = g.solved;
  return `<div class="brief"><div class="tag">${p.robot} · ${p.name}</div><div class="task">TASK: ${p.task}</div></div>
    <div class="helper">${p.helper}</div>
    ${g.hintUsed ? `<div class="hint">HINT: ${p.hint}</div>` : `<button id="hint">Request hint (max ★★)</button>`}
    ${g.nudge ? `<div class="nudge">${g.nudge}</div>` : ""}
    ${g.locked ? `<div class="locked">OUT OF KEYSTROKES — uplink lost. Press ${RESET_KEY} to reconnect.</div>` : ""}
    ${sv ? `<div class="win">TASK COMPLETE ${"★".repeat(stars())}${"☆".repeat(3 - stars())}<br/>Optimal: <code>${p.optimal}</code> (${p.optimal.length} keys)<br/><small>${RESET_KEY} to replay</small></div>` : ""}`;
}

// ---------- variants ----------
function animate(onFrame: (i: number) => void, frames: number, ms: number, loop: boolean) {
  if (g.anim.timer) clearInterval(g.anim.timer);
  g.anim.frame = 0;
  onFrame(0);
  g.anim.timer = window.setInterval(() => {
    g.anim.frame++;
    if (g.anim.frame >= frames) {
      if (!loop) { clearInterval(g.anim.timer!); g.anim.timer = null; return; }
      g.anim.frame = loop ? -3 : frames - 1;
    }
    onFrame(Math.max(0, g.anim.frame));
  }, ms);
}

function failTile(sim: SimResult) {
  if (!sim.failure) return null;
  return sim.frames[sim.frames.length - 1].world.robot;
}

// A: buffer left, scene right; ghost of predicted path updates every keystroke; robot actually runs only once solved.
function renderA(runNow: boolean) {
  app.innerHTML = `<div class="layoutA">
      <div class="col"><div class="buf">${bufferHtml({})}</div>${statusline()}</div>
      <div class="col"><canvas id="scene"></canvas><div class="caption" id="cap"></div>${sidePanel()}</div>
    </div>`;
  const cv = document.getElementById("scene") as HTMLCanvasElement;
  const cap = document.getElementById("cap")!;
  if (g.solved && runNow) {
    animate((i) => {
      const f = g.sim.frames[Math.min(i, g.sim.frames.length - 1)];
      drawScene(cv, f.world, { flash: i === g.sim.frames.length - 1 ? "#39d98a22" : undefined });
      cap.textContent = `EXECUTING: ${f.event}`;
    }, g.sim.frames.length, 350, false);
  } else if (!g.solved) {
    drawScene(cv, g.p.start, { ghost: g.sim, failAt: failTile(g.sim) });
    cap.textContent = g.sim.failure ? `PREDICTED FAILURE line ${g.sim.failure.line + 1}: ${g.sim.failure.reason}` : "PREDICTION: task completes";
  }
}

// B: scene top, console bottom; gutter shows per-line parse status; robot replays to failure after each normal-mode edit.
let lastLinesB = "";
function renderB() {
  const sim = g.sim;
  const gutter = (i: number) => {
    const ok = parseLine(g.vim.s.lines[i]) !== null;
    if (!ok) return `<b class="bad">✗</b>`;
    if (sim.failure && sim.failure.line === i) return `<b class="warn">!</b>`;
    if (sim.failure && i > sim.failure.line) return `<b class="dim">·</b>`;
    return `<b class="good">✓</b>`;
  };
  app.innerHTML = `<div class="layoutB">
      <div class="sceneWrap"><canvas id="scene"></canvas><div class="caption" id="cap"></div><div class="sideB">${sidePanel()}</div></div>
      <div class="console"><div class="ctitle">UPLINK ▸ ${g.p.robot}.prog</div><div class="buf">${bufferHtml({ gutter })}</div>${statusline()}</div>
    </div>`;
  const cv = document.getElementById("scene") as HTMLCanvasElement;
  const cap = document.getElementById("cap")!;
  const key = g.vim.s.lines.join("\n") + g.vim.s.mode;
  if (key !== lastLinesB && g.vim.s.mode === "NORMAL") {
    lastLinesB = key;
    animate((i) => {
      const f = sim.frames[Math.min(i, sim.frames.length - 1)];
      const end = i >= sim.frames.length - 1;
      drawScene(cv, f.world, { failAt: end ? failTile(sim) : null, flash: end && sim.success ? "#39d98a22" : end && sim.failure ? "#ff5c5c18" : undefined });
      cap.textContent = end ? (sim.success ? "TASK COMPLETE" : `FAILED line ${sim.failure!.line + 1}: ${sim.failure!.reason}`) : `> ${f.event}`;
    }, sim.frames.length, 140, false);
  } else {
    const f = sim.frames[Math.min(g.anim.frame, sim.frames.length - 1)];
    drawScene(cv, f.world, { failAt: g.anim.timer ? null : failTile(sim) });
    cap.textContent = g.vim.s.mode === "INSERT" ? "editing… robot holds position" : sim.success ? "TASK COMPLETE" : sim.failure ? `FAILED line ${sim.failure.line + 1}: ${sim.failure.reason}` : "";
  }
}

// C: scene fills the screen, buffer is a translucent HUD; robot loops the current program forever and the executing line is highlighted.
function renderC() {
  const draw = () => {
    const sim = g.sim;
    const f = sim.frames[Math.min(g.anim.frame, sim.frames.length - 1)];
    const end = g.anim.frame >= sim.frames.length - 1;
    app.innerHTML = `<div class="layoutC">
        <canvas id="scene"></canvas>
        <div class="hud"><div class="ctitle">${g.p.robot} ▸ LIVE PROGRAM</div><div class="buf">${bufferHtml({ execLine: f.line })}</div>${statusline()}<div class="caption">${end && sim.failure ? `✗ line ${sim.failure.line + 1}: ${sim.failure.reason}` : end && sim.success ? "✓ TASK COMPLETE" : `▶ ${f.event}`}</div></div>
        <div class="sideC">${sidePanel()}</div>
      </div>`;
    drawScene(document.getElementById("scene") as HTMLCanvasElement, f.world, { failAt: end ? failTile(sim) : null, flash: end && sim.success ? "#39d98a22" : undefined });
    bindButtons();
  };
  if (!g.anim.timer) animate(() => draw(), g.sim.frames.length, 450, !g.solved);
  else draw();
}

function render(event: "key" | "init" | "solved" = "key") {
  if (variant === "A") renderA(event === "solved");
  else if (variant === "B") renderB();
  else {
    if (event !== "key") { if (g.anim.timer) clearInterval(g.anim.timer); g.anim.timer = null; }
    renderC();
  }
  bindButtons();
  renderBar();
}

function bindButtons() {
  document.getElementById("hint")?.addEventListener("click", () => { g.hintUsed = true; render(); });
}

// ---------- input ----------
window.addEventListener("keydown", (e) => {
  if (e.metaKey) return;
  if (e.key === RESET_KEY) {
    e.preventDefault();
    if (g.anim.timer) clearInterval(g.anim.timer);
    g = newGame();
    lastLinesB = "";
    render("init");
    return;
  }
  if (["Shift", "Control", "Alt", "CapsLock", "Meta"].includes(e.key)) return;
  e.preventDefault();
  if (BLOCKED.has(e.key)) { g.nudge = `${e.key} is offline. Use vim!`; render(); return; }
  if (g.locked || g.solved) return;
  g.nudge = "";
  const k = e.key === "[" && e.ctrlKey ? "Escape" : e.ctrlKey ? `C-${e.key}` : e.key;
  g.vim.key(k);
  g.sim = simulate(g.p, g.vim.s.lines);
  if (isSolved()) { g.solved = true; render("solved"); return; }
  if (g.vim.s.keystrokes >= g.p.budget.pass) g.locked = true;
  render();
});
window.addEventListener("mousedown", (e) => {
  if ((e.target as HTMLElement).closest("#proto-bar, button")) return;
  e.preventDefault();
  g.nudge = "Mouse input is offline. Use vim!";
  render();
});

// ---------- prototype switcher ----------
function go(v: VariantKey, pz: number) {
  location.search = `?variant=${v}&puzzle=${pz}`;
}
function renderBar() {
  const keys = Object.keys(VARIANTS) as VariantKey[];
  const i = keys.indexOf(variant);
  const bar = document.getElementById("proto-bar")!;
  bar.innerHTML = `<button id="pv">◀</button><span><b>${variant}</b> ${VARIANTS[variant]}</span><button id="nv">▶</button>
    <span class="sep">|</span>${PUZZLES.map((p, j) => `<button class="pz ${j === puzzleIdx ? "on" : ""}" data-j="${j}">${p.name}</button>`).join("")}`;
  bar.querySelector("#pv")!.addEventListener("click", () => go(keys[(i + keys.length - 1) % keys.length], puzzleIdx));
  bar.querySelector("#nv")!.addEventListener("click", () => go(keys[(i + 1) % keys.length], puzzleIdx));
  bar.querySelectorAll<HTMLButtonElement>(".pz").forEach((b) => b.addEventListener("click", () => go(variant, Number(b.dataset.j))));
}

g = newGame();
render("init");
