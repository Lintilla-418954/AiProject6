// PROTOTYPE: throwaway token-level BFS solver over the engine stub.
import { type State, step, isSolved } from "./engine.ts";

export interface Toolkit {
  name: string;
  normal: string[];
  counts: boolean;
  charArgs: string[];
  insert: boolean;
}

export interface Result {
  solution: string[] | null;
  depth: number;
  expanded: number;
  perDepth: number[];
  ms: number;
  aborted: boolean;
}

const key = (s: State) =>
  s.lines.join("\n") + "\u0001" + s.r + "," + s.c + s.mode + s.pend.join("") + "\u0001" + s.reg.linewise + s.reg.text + "\u0001" + (s.last ?? []).join("") + "\u0001" + s.cur.join("");

function alphabet(s: State, kit: Toolkit, insertChars: string[], argChars: string[]): string[] {
  if (s.mode === "i") return kit.insert ? [...insertChars, "<Esc>", "<BS>"] : ["<Esc>"];
  const last = s.pend[s.pend.length - 1];
  if (last && ["f", "t", "F", "T", "r"].includes(last)) return last === "r" ? insertChars : argChars;
  if (last && (last === "i" || last === "a") && s.pend.some((p) => p === "d" || p === "c" || p === "y")) return ["w", "(", '"'];
  const out = [...kit.normal];
  if (kit.counts) for (let d = 1; d <= 9; d++) out.push(String(d));
  return out;
}

export function solve(start: State, target: string[], kit: Toolkit, maxDepth: number, nodeLimit = 3_000_000): Result {
  const t0 = performance.now();
  const insertChars = [...new Set(target.join(""))].sort();
  const argChars = [...new Set(start.lines.join("") + target.join(""))].sort().filter((c) => kit.charArgs.length === 0 || true);
  const seen = new Set<string>([key(start)]);
  let frontier: { s: State; path: string[] }[] = [{ s: start, path: [] }];
  const perDepth: number[] = [1];
  let expanded = 0;
  if (isSolved(start, target)) return { solution: [], depth: 0, expanded, perDepth, ms: 0, aborted: false };
  for (let d = 1; d <= maxDepth; d++) {
    const next: typeof frontier = [];
    for (const { s, path } of frontier) {
      expanded++;
      for (const tok of alphabet(s, kit, insertChars, argChars)) {
        let n: State;
        try { n = step(s, tok); } catch { continue; }
        const k = key(n);
        if (seen.has(k)) continue;
        seen.add(k);
        const p = [...path, tok];
        if (isSolved(n, target)) return { solution: p, depth: d, expanded, perDepth: [...perDepth, next.length + 1], ms: performance.now() - t0, aborted: false };
        next.push({ s: n, path: p });
      }
      if (seen.size > nodeLimit) return { solution: null, depth: d, expanded, perDepth: [...perDepth, next.length], ms: performance.now() - t0, aborted: true };
    }
    perDepth.push(next.length);
    frontier = next;
  }
  return { solution: null, depth: maxDepth, expanded, perDepth, ms: performance.now() - t0, aborted: false };
}

const slimKey = (s: State, kit: Toolkit) => {
  const dot = kit.normal.includes(".");
  const yank = kit.normal.includes("p") || kit.normal.includes("P");
  return s.lines.join("\n") + "\u0001" + s.r + "," + s.c + s.mode + s.pend.join("") + (yank ? "\u0001" + s.reg.linewise + s.reg.text : "") + (dot ? "\u0001" + (s.last ?? []).join("") + "\u0001" + s.cur.join("") : "");
};

function targetSubstrings(target: string[], maxLen: number): string[] {
  const out = new Set<string>([""]);
  for (const l of target) for (let a = 0; a < l.length; a++) for (let b = a + 1; b <= Math.min(l.length, a + maxLen); b++) out.add(l.slice(a, b));
  return [...out];
}

export function solveMacro(start: State, target: string[], kit: Toolkit, maxCost: number, nodeLimit = 3_000_000): Result {
  const t0 = performance.now();
  const argChars = [...new Set(start.lines.join("") + target.join(""))].sort();
  const insertChars = [...new Set(target.join(""))].sort();
  const subs = kit.insert ? targetSubstrings(target, 12) : [];
  const best = new Map<string, number>([[slimKey(start, kit), 0]]);
  const buckets: { s: State; path: string[] }[][] = [[{ s: start, path: [] }]];
  const perDepth: number[] = [];
  let expanded = 0;
  for (let cost = 0; cost <= maxCost; cost++) {
    const bucket = buckets[cost] ?? [];
    perDepth.push(bucket.length);
    for (const { s, path } of bucket) {
      if (best.get(slimKey(s, kit))! < cost) continue;
      if (isSolved(s, target)) return { solution: path, depth: cost, expanded, perDepth, ms: performance.now() - t0, aborted: false };
      expanded++;
      const moves: string[][] = s.mode === "i" ? subs.map((x) => [...x, "<Esc>"]) : alphabet(s, kit, insertChars, argChars).map((t) => [t]);
      for (const mv of moves) {
        const c2 = cost + mv.length;
        if (c2 > maxCost) continue;
        let n = s;
        try { for (const t of mv) n = step(n, t); } catch { continue; }
        const k = slimKey(n, kit);
        const prev = best.get(k);
        if (prev !== undefined && prev <= c2) continue;
        best.set(k, c2);
        (buckets[c2] ??= []).push({ s: n, path: [...path, ...mv] });
      }
      if (best.size > nodeLimit) return { solution: null, depth: cost, expanded, perDepth, ms: performance.now() - t0, aborted: true };
    }
    buckets[cost] = [];
  }
  return { solution: null, depth: maxCost, expanded, perDepth, ms: performance.now() - t0, aborted: false };
}

function lev(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export function solveBeam(start: State, target: string[], kit: Toolkit, maxCost: number, width = 20000): Result {
  const t0 = performance.now();
  const tj = target.join("\n");
  const argChars = [...new Set(start.lines.join("") + target.join(""))].sort();
  const insertChars = [...new Set(target.join(""))].sort();
  const subs = kit.insert ? targetSubstrings(target, 12) : [];
  const h = (s: State) => lev(s.lines.join("\n"), tj) + (s.mode === "i" ? 1 : 0) + s.pend.length * 0.5;
  const seen = new Set<string>([slimKey(start, kit)]);
  const buckets: { s: State; path: string[] }[][] = [[{ s: start, path: [] }]];
  const perDepth: number[] = [];
  let expanded = 0;
  for (let cost = 0; cost <= maxCost; cost++) {
    let bucket = buckets[cost] ?? [];
    if (bucket.length > width) bucket = bucket.map((x) => ({ x, v: h(x.s) })).sort((a, b) => a.v - b.v).slice(0, width).map((y) => y.x);
    perDepth.push(bucket.length);
    for (const { s, path } of bucket) {
      if (isSolved(s, target)) return { solution: path, depth: cost, expanded, perDepth, ms: performance.now() - t0, aborted: false };
      expanded++;
      const moves: string[][] = s.mode === "i" ? subs.map((x) => [...x, "<Esc>"]) : alphabet(s, kit, insertChars, argChars).map((t) => [t]);
      for (const mv of moves) {
        const c2 = cost + mv.length;
        if (c2 > maxCost) continue;
        let n = s;
        try { for (const t of mv) n = step(n, t); } catch { continue; }
        const k = slimKey(n, kit);
        if (seen.has(k)) continue;
        seen.add(k);
        (buckets[c2] ??= []).push({ s: n, path: [...path, ...mv] });
      }
    }
    buckets[cost] = [];
  }
  return { solution: null, depth: maxCost, expanded, perDepth, ms: performance.now() - t0, aborted: false };
}
