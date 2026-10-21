// PROTOTYPE: throwaway pure vim stub for solver-feasibility measurements, not the real engine.
export type Mode = "n" | "i";

export interface State {
  readonly lines: readonly string[];
  readonly r: number;
  readonly c: number;
  readonly mode: Mode;
  readonly pend: readonly string[];
  readonly reg: { readonly text: string; readonly linewise: boolean };
  readonly last: readonly string[] | null;
  readonly cur: readonly string[];
  readonly dirty: boolean;
}

export function initialState(lines: string[], r = 0, c = 0): State {
  return { lines, r, c, mode: "n", pend: [], reg: { text: "", linewise: false }, last: null, cur: [], dirty: false };
}

export function parseKeys(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "<") {
      const j = s.indexOf(">", i);
      if (j > i) { out.push(s.slice(i, j + 1)); i = j; continue; }
    }
    out.push(s[i]);
  }
  return out;
}

export function run(s: State, tokens: string[]): State {
  for (const t of tokens) s = step(s, t);
  return s;
}

const cls = (ch: string | undefined) => (ch === undefined || ch === " " ? 0 : /\w/.test(ch) ? 1 : 2);
const firstNonBlank = (l: string) => { const i = l.search(/\S/); return i < 0 ? Math.max(0, l.length - 1) : i; };
const clampN = (lines: readonly string[], r: number, c: number) => Math.max(0, Math.min(c, lines[r].length - 1));

type Pos = [number, number];
type Motion = { to: Pos; kind: "excl" | "incl" | "line" } | null;

function wordFwd(L: readonly string[], r: number, c: number): Pos {
  const k = cls(L[r][c]);
  if (k) while (c < L[r].length && cls(L[r][c]) === k) c++;
  for (;;) {
    while (c < L[r].length && L[r][c] === " ") c++;
    if (c < L[r].length) return [r, c];
    if (r >= L.length - 1) return [r, L[r].length];
    r++; c = 0;
    if (L[r].length === 0) return [r, 0];
  }
}

function wordEnd(L: readonly string[], r: number, c: number): Pos {
  c++;
  for (;;) {
    while (c < L[r].length && L[r][c] === " ") c++;
    if (c < L[r].length) break;
    if (r >= L.length - 1) return [r, Math.max(0, L[r].length - 1)];
    r++; c = 0;
  }
  const k = cls(L[r][c]);
  while (c + 1 < L[r].length && cls(L[r][c + 1]) === k) c++;
  return [r, c];
}

function wordBack(L: readonly string[], r: number, c: number): Pos {
  c--;
  for (;;) {
    while (c >= 0 && L[r][c] === " ") c--;
    if (c >= 0) break;
    if (r === 0) return [0, 0];
    r--; c = L[r].length - 1;
    if (L[r].length === 0) return [r, 0];
  }
  const k = cls(L[r][c]);
  while (c > 0 && cls(L[r][c - 1]) === k) c--;
  return [r, c];
}

function motion(s: State, m: string, n: number, arg?: string): Motion {
  const L = s.lines;
  let r = s.r, c = s.c;
  switch (m) {
    case "h": if (c === 0) return null; return { to: [r, Math.max(0, c - n)], kind: "excl" };
    case "l": if (c >= L[r].length - 1 && L[r].length > 0 && s.pend.length === 0) return null; return { to: [r, Math.min(L[r].length, c + n)], kind: "excl" };
    case "j": if (r + n > L.length - 1) return null; return { to: [r + n, c], kind: "line" };
    case "k": if (r - n < 0) return null; return { to: [r - n, c], kind: "line" };
    case "0": return { to: [r, 0], kind: "excl" };
    case "^": return { to: [r, firstNonBlank(L[r])], kind: "excl" };
    case "$": return { to: [r, Math.max(0, L[r].length - 1)], kind: "incl" };
    case "G": return { to: [L.length - 1, 0], kind: "line" };
    case "gg": return { to: [0, 0], kind: "line" };
    case "w": for (let i = 0; i < n; i++) [r, c] = wordFwd(L, r, c); return { to: [r, c], kind: "excl" };
    case "e": for (let i = 0; i < n; i++) [r, c] = wordEnd(L, r, c); return { to: [r, c], kind: "incl" };
    case "b": for (let i = 0; i < n; i++) [r, c] = wordBack(L, r, c); return { to: [r, c], kind: "excl" };
    case "f": case "t": {
      let x = c;
      for (let i = 0; i < n; i++) { x = L[r].indexOf(arg!, x + 1 + (m === "t" && i === 0 ? 1 : 0)); if (x < 0) return null; }
      return { to: [r, m === "t" ? x - 1 : x], kind: "incl" };
    }
    case "F": case "T": {
      let x = c;
      for (let i = 0; i < n; i++) { x = L[r].lastIndexOf(arg!, x - 1 - (m === "T" && i === 0 ? 1 : 0)); if (x < 0) return null; }
      return { to: [r, m === "T" ? x + 1 : x], kind: "excl" };
    }
  }
  return null;
}

function textObject(s: State, kind: string, obj: string): [Pos, Pos] | null {
  const l = s.lines[s.r], c = s.c;
  if (obj === "w") {
    if (!l.length) return null;
    const k = cls(l[c]);
    let a = c, b = c;
    while (a > 0 && cls(l[a - 1]) === k) a--;
    while (b < l.length && cls(l[b]) === k) b++;
    if (kind === "a") { if (k) { while (b < l.length && l[b] === " ") b++; } else { while (b < l.length && cls(l[b]) === cls(l[b] ?? "")) b++; } }
    return [[s.r, a], [s.r, b]];
  }
  const pairs: Record<string, [string, string]> = { "(": ["(", ")"], ")": ["(", ")"], '"': ['"', '"'] };
  const p = pairs[obj];
  if (!p) return null;
  const a = l.lastIndexOf(p[0], c === 0 || l[c] !== p[0] || p[0] === p[1] ? c : c);
  if (a < 0) return null;
  const b = l.indexOf(p[1], Math.max(a + 1, p[0] === p[1] ? a + 1 : c));
  if (b < 0) return null;
  return kind === "i" ? [[s.r, a + 1], [s.r, b]] : [[s.r, a], [s.r, b + 1]];
}

type Edit = { lines: string[]; r: number; c: number; reg?: State["reg"]; mode?: Mode };

function opRange(s: State, op: string, from: Pos, to: Pos, kind: "excl" | "incl" | "line"): Edit {
  const L = [...s.lines];
  if (kind === "line") {
    const r1 = Math.min(from[0], to[0]), r2 = Math.max(from[0], to[0]);
    const text = L.slice(r1, r2 + 1).join("\n");
    const reg = { text, linewise: true };
    if (op === "y") return { lines: L, r: r1, c: s.r === r1 ? s.c : 0, reg };
    if (op === "c") {
      const indent = L[r1].match(/^ */)![0];
      L.splice(r1, r2 - r1 + 1, indent);
      return { lines: L, r: r1, c: indent.length, reg, mode: "i" };
    }
    L.splice(r1, r2 - r1 + 1);
    if (!L.length) L.push("");
    const r = Math.min(r1, L.length - 1);
    return { lines: L, r, c: firstNonBlank(L[r]), reg };
  }
  let [a, b] = from[0] < to[0] || (from[0] === to[0] && from[1] <= to[1]) ? [from, to] : [to, from];
  if (kind === "incl") b = [b[0], b[1] + 1];
  const text = a[0] === b[0] ? L[a[0]].slice(a[1], b[1]) : [L[a[0]].slice(a[1]), ...L.slice(a[0] + 1, b[0]), L[b[0]].slice(0, b[1])].join("\n");
  const reg = { text, linewise: false };
  if (op === "y") return { lines: L, r: a[0], c: a[1], reg };
  L.splice(a[0], b[0] - a[0] + 1, L[a[0]].slice(0, a[1]) + L[b[0]].slice(b[1]));
  if (op === "c") return { lines: L, r: a[0], c: a[1], reg, mode: "i" };
  return { lines: L, r: a[0], c: clampN(L, a[0], a[1]), reg };
}

function paste(s: State, after: boolean): Edit | null {
  const { text, linewise } = s.reg;
  if (!text && !linewise) return null;
  const L = [...s.lines];
  if (linewise) {
    const at = after ? s.r + 1 : s.r;
    const add = text.split("\n");
    L.splice(at, 0, ...add);
    return { lines: L, r: at, c: firstNonBlank(L[at]) };
  }
  const l = L[s.r];
  const at = after && l.length ? s.c + 1 : s.c;
  const parts = text.split("\n");
  if (parts.length === 1) {
    L[s.r] = l.slice(0, at) + text + l.slice(at);
    return { lines: L, r: s.r, c: at + text.length - 1 };
  }
  const tail = l.slice(at);
  L.splice(s.r, 1, l.slice(0, at) + parts[0], ...parts.slice(1, -1), parts[parts.length - 1] + tail);
  return { lines: L, r: s.r, c: at };
}

type Parsed = "incomplete" | "invalid" | { n: number; cmd: string; arg?: string; op?: string; on?: number };

const MOTIONS = new Set(["h", "j", "k", "l", "w", "b", "e", "0", "^", "$", "G"]);
const ARG_MOTIONS = new Set(["f", "t", "F", "T"]);
const SIMPLE = new Set(["x", "X", "D", "C", "s", "S", "p", "P", "J", "~", "i", "a", "I", "A", "o", "O", "."]);

function parse(p: readonly string[]): Parsed {
  let i = 0;
  const count = () => {
    let d = "";
    while (i < p.length && /^[0-9]$/.test(p[i]) && (d || p[i] !== "0")) d += p[i++];
    return d ? parseInt(d, 10) : 0;
  };
  const n1 = count();
  if (i >= p.length) return "incomplete";
  const t = p[i++];
  const n = n1 || 1;
  const motionAt = (op?: string, on?: number): Parsed => {
    if (i >= p.length) return "incomplete";
    const m = p[i++];
    if (MOTIONS.has(m)) return i === p.length ? { n, cmd: m, op, on } : "invalid";
    if (m === "g") { if (i >= p.length) return "incomplete"; return p[i++] === "g" && i === p.length ? { n, cmd: "gg", op, on } : "invalid"; }
    if (ARG_MOTIONS.has(m)) { if (i >= p.length) return "incomplete"; return i === p.length - 1 ? { n, cmd: m, arg: p[i], op, on } : "invalid"; }
    if (op && (m === "i" || m === "a")) { if (i >= p.length) return "incomplete"; return i === p.length - 1 ? { n, cmd: "obj" + m, arg: p[i], op, on } : "invalid"; }
    if (op && m === op) return i === p.length ? { n, cmd: "line", op, on } : "invalid";
    return "invalid";
  };
  if (t === "d" || t === "c" || t === "y") { const on = count(); return motionAt(t, on || 1); }
  i--;
  if (p[i] === "r") { i++; if (i >= p.length) return "incomplete"; return i === p.length - 1 && p[i].length === 1 ? { n, cmd: "r", arg: p[i] } : "invalid"; }
  if (SIMPLE.has(p[i])) return i === p.length - 1 ? { n, cmd: p[i] } : "invalid";
  return motionAt();
}

function idle(s: State, patch: Partial<State>, change: boolean, tok: string): State {
  const cur = [...s.cur, tok];
  const dirty = s.dirty || change;
  const next = { ...s, ...patch, pend: [] };
  if (next.mode === "i") return { ...next, cur, dirty: true };
  return { ...next, cur: [], dirty: false, last: dirty && cur[0] !== "." ? cur : s.last };
}

function bell(s: State): State {
  return { ...s, pend: [], cur: [], dirty: false };
}

function apply(s: State, e: Edit | null, tok: string): State {
  if (!e) return bell(s);
  const mode = e.mode ?? "n";
  const c = mode === "n" ? clampN(e.lines, e.r, e.c) : e.c;
  return idle(s, { lines: e.lines, r: e.r, c, mode, reg: e.reg ?? s.reg }, true, tok);
}

function insertStep(s: State, t: string): State {
  const L = [...s.lines];
  const l = L[s.r];
  if (t === "<Esc>") return idle(s, { mode: "n", c: Math.max(0, s.c - 1) }, true, t);
  if (t === "<CR>") {
    const indent = l.match(/^ */)![0];
    L.splice(s.r, 1, l.slice(0, s.c), indent + l.slice(s.c).replace(/^ +/, ""));
    return { ...s, lines: L, r: s.r + 1, c: indent.length, cur: [...s.cur, t] };
  }
  if (t === "<BS>") {
    if (s.c === 0) return { ...s, cur: [...s.cur, t] };
    L[s.r] = l.slice(0, s.c - 1) + l.slice(s.c);
    return { ...s, lines: L, c: s.c - 1, cur: [...s.cur, t] };
  }
  L[s.r] = l.slice(0, s.c) + t + l.slice(s.c);
  return { ...s, lines: L, c: s.c + 1, cur: [...s.cur, t] };
}

export function step(s: State, t: string): State {
  if (s.mode === "i") return insertStep(s, t);
  if (t === "<Esc>") return bell(s);
  const pend = [...s.pend, t];
  const p = parse(pend);
  if (p === "incomplete") return { ...s, pend, cur: [...s.cur, t] };
  if (p === "invalid") return bell(s);
  const L = s.lines, l = L[s.r];
  const toInsert = (lines: string[], r: number, c: number) => idle(s, { lines, r, c, mode: "i" }, true, t);
  if (p.op) {
    const n = p.n * (p.on ?? 1);
    if (p.cmd === "line") {
      if (s.r + n - 1 > L.length - 1) return bell(s);
      return apply(s, opRange(s, p.op, [s.r, 0], [s.r + n - 1, 0], "line"), t);
    }
    if (p.cmd === "obji" || p.cmd === "obja") {
      const o = textObject(s, p.cmd[3], p.arg!);
      if (!o) return bell(s);
      return apply(s, opRange(s, p.op, o[0], o[1], "excl"), t);
    }
    let cmd = p.cmd;
    if (p.op === "c" && cmd === "w" && cls(l[s.c])) cmd = "e";
    const m = motion(s, cmd, n, p.arg);
    if (!m) return bell(s);
    let to = m.to;
    if (cmd === "w" && to[0] > s.r) to = [s.r, l.length];
    return apply(s, opRange(s, p.op, [s.r, s.c], to, m.kind), t);
  }
  switch (p.cmd) {
    case "x": case "X": case "D": case "C": case "s": case "S": {
      const map: Record<string, string> = { x: "dl", X: "dh", D: "d$", C: "c$", s: "cl", S: "cc" };
      if (!l.length && (p.cmd === "x" || p.cmd === "X")) return bell(s);
      const keys = (p.n > 1 ? String(p.n) : "") + map[p.cmd];
      const r = run({ ...s, pend: [], cur: [] }, keys.split(""));
      return { ...r, cur: r.mode === "i" ? [...s.cur, t] : [], last: r.mode === "i" ? r.last : r.lines !== s.lines ? [...s.cur, t] : r.last };
    }
    case "p": case "P": {
      let e = paste(s, p.cmd === "p");
      for (let k = 1; e && k < p.n; k++) e = paste({ ...s, lines: e.lines, r: e.r, c: e.c }, true);
      return apply(s, e, t);
    }
    case "J": {
      if (s.r >= L.length - 1) return bell(s);
      const A = [...L];
      const left = A[s.r].replace(/ +$/, ""), right = A[s.r + 1].replace(/^ +/, "");
      const joined = right ? (left ? left + " " + right : right) : left;
      A.splice(s.r, 2, joined);
      return apply(s, { lines: A, r: s.r, c: right ? left.length : Math.max(0, left.length - 1) }, t);
    }
    case "~": {
      if (!l.length) return bell(s);
      const A = [...L];
      const e = Math.min(l.length, s.c + p.n);
      A[s.r] = l.slice(0, s.c) + [...l.slice(s.c, e)].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join("") + l.slice(e);
      return apply(s, { lines: A, r: s.r, c: e }, t);
    }
    case "r": {
      if (s.c + p.n > l.length) return bell(s);
      const A = [...L];
      A[s.r] = l.slice(0, s.c) + p.arg!.repeat(p.n) + l.slice(s.c + p.n);
      return apply(s, { lines: A, r: s.r, c: s.c + p.n - 1 }, t);
    }
    case "i": return toInsert([...L], s.r, s.c);
    case "a": return toInsert([...L], s.r, l.length ? s.c + 1 : 0);
    case "I": return toInsert([...L], s.r, firstNonBlank(l) === l.length - 1 && l.trim() === "" ? l.length : l.search(/\S|$/));
    case "A": return toInsert([...L], s.r, l.length);
    case "o": case "O": {
      const A = [...L];
      const indent = l.match(/^ */)![0];
      const at = p.cmd === "o" ? s.r + 1 : s.r;
      A.splice(at, 0, indent);
      return toInsert(A, at, indent.length);
    }
    case ".": {
      if (!s.last) return bell(s);
      const r = run({ ...s, pend: [], cur: [] }, [...s.last]);
      return { ...r, last: s.last, cur: [], dirty: false };
    }
  }
  const m = motion(s, p.cmd, p.n, p.arg);
  if (!m) return bell(s);
  const [r, c] = m.to;
  return { ...s, pend: [], cur: [], dirty: false, r, c: m.kind === "line" && p.cmd === "G" || p.cmd === "gg" ? firstNonBlank(L[r]) : clampN(L, r, c) };
}

export const isSolved = (s: State, target: readonly string[]) =>
  s.mode === "n" && s.pend.length === 0 && s.lines.length === target.length && s.lines.every((l, i) => l === target[i]);
