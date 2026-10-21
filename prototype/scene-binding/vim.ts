// PROTOTYPE: throwaway minimal vim subset, just enough to play the stub puzzles.
export type Mode = "NORMAL" | "INSERT";

export interface VimState {
  lines: string[];
  row: number;
  col: number;
  mode: Mode;
  keystrokes: number;
  register: { text: string[]; linewise: boolean };
}

const isWord = (c: string) => /\w/.test(c);

export class Vim {
  s: VimState;
  private pending = "";
  private undo: { lines: string[]; row: number; col: number }[] = [];

  constructor(lines: string[]) {
    this.s = { lines: [...lines], row: 0, col: 0, mode: "NORMAL", keystrokes: 0, register: { text: [], linewise: false } };
  }

  get pendingKeys() {
    return this.pending;
  }

  private snapshot() {
    this.undo.push({ lines: [...this.s.lines], row: this.s.row, col: this.s.col });
  }

  private clamp() {
    const s = this.s;
    s.row = Math.max(0, Math.min(s.row, s.lines.length - 1));
    const max = s.mode === "INSERT" ? s.lines[s.row].length : Math.max(0, s.lines[s.row].length - 1);
    s.col = Math.max(0, Math.min(s.col, max));
  }

  private nextWordStart(row: number, col: number): [number, number] {
    const L = this.s.lines;
    const line = L[row];
    let c = col;
    if (c < line.length && line[c] !== " ") {
      const w = isWord(line[c]);
      while (c < line.length && line[c] !== " " && isWord(line[c]) === w) c++;
    }
    while (c < line.length && line[c] === " ") c++;
    if (c >= line.length && row < L.length - 1) {
      let r = row + 1;
      let cc = 0;
      while (cc < L[r].length && L[r][cc] === " ") cc++;
      return [r, cc];
    }
    return [row, c];
  }

  private wordEnd(row: number, col: number): [number, number] {
    const L = this.s.lines;
    let r = row;
    let c = col + 1;
    while (true) {
      while (c < L[r].length && L[r][c] === " ") c++;
      if (c < L[r].length) break;
      if (r >= L.length - 1) return [r, L[r].length - 1];
      r++;
      c = 0;
    }
    const w = isWord(L[r][c]);
    while (c + 1 < L[r].length && L[r][c + 1] !== " " && isWord(L[r][c + 1]) === w) c++;
    return [r, c];
  }

  private prevWordStart(row: number, col: number): [number, number] {
    const L = this.s.lines;
    let r = row;
    let c = col - 1;
    while (true) {
      while (c >= 0 && L[r][c] === " ") c--;
      if (c >= 0) break;
      if (r === 0) return [0, 0];
      r--;
      c = L[r].length - 1;
    }
    const w = isWord(L[r][c]);
    while (c > 0 && L[r][c - 1] !== " " && isWord(L[r][c - 1]) === w) c--;
    return [r, c];
  }

  /** Returns false if the key was not understood (still counted, as in VimGolf). */
  key(k: string): boolean {
    this.s.keystrokes++;
    const s = this.s;
    if (s.mode === "INSERT") return this.insertKey(k);

    const seq = this.pending + k;
    const m = /^(\d*)(.*)$/.exec(seq)!;
    if (/^[1-9]\d*$/.test(seq)) {
      this.pending = seq;
      return true;
    }
    const count = m[1] ? parseInt(m[1], 10) : 1;
    const cmd = m[2];
    const needsMore = ["d", "c", "r", "g", "y"];
    if (needsMore.includes(cmd)) {
      this.pending = seq;
      return true;
    }
    this.pending = "";
    const line = () => s.lines[s.row];

    switch (cmd) {
      case "h": s.col -= count; break;
      case "l": s.col += count; break;
      case "j": s.row += count; break;
      case "k": s.row -= count; break;
      case "0": s.col = 0; break;
      case "^": s.col = line().search(/\S|$/); break;
      case "$": s.col = line().length - 1; break;
      case "w": for (let i = 0; i < count; i++) [s.row, s.col] = this.nextWordStart(s.row, s.col); break;
      case "e": for (let i = 0; i < count; i++) [s.row, s.col] = this.wordEnd(s.row, s.col); break;
      case "b": for (let i = 0; i < count; i++) [s.row, s.col] = this.prevWordStart(s.row, s.col); break;
      case "gg": s.row = m[1] ? count - 1 : 0; s.col = 0; break;
      case "G": s.row = m[1] ? count - 1 : s.lines.length - 1; s.col = 0; break;
      case "x": {
        this.snapshot();
        const l = line();
        s.register = { text: [l.slice(s.col, s.col + count)], linewise: false };
        s.lines[s.row] = l.slice(0, s.col) + l.slice(s.col + count);
        break;
      }
      case "D": {
        this.snapshot();
        s.lines[s.row] = line().slice(0, s.col);
        break;
      }
      case "dd": case "yy": {
        const taken = s.lines.slice(s.row, s.row + count);
        s.register = { text: taken, linewise: true };
        if (cmd === "yy") break;
        this.snapshot();
        s.lines.splice(s.row, count);
        if (s.lines.length === 0) s.lines.push("");
        s.col = 0;
        break;
      }
      case "dw": case "cw": case "ce": case "de": {
        this.snapshot();
        let end: number;
        if (cmd === "cw" || cmd[1] === "e") {
          let c = s.col;
          for (let i = 0; i < count; i++) c = this.wordEnd(s.row, i === 0 ? c - 1 : c)[1];
          end = c + 1;
        } else {
          let r = s.row, c = s.col;
          for (let i = 0; i < count; i++) [r, c] = this.nextWordStart(r, c);
          end = r === s.row ? c : line().length;
        }
        const l = line();
        s.lines[s.row] = l.slice(0, s.col) + l.slice(end);
        if (cmd[0] === "c") s.mode = "INSERT";
        break;
      }
      case "p": case "P": {
        this.snapshot();
        const reg = s.register;
        if (reg.linewise) {
          const at = cmd === "p" ? s.row + 1 : s.row;
          s.lines.splice(at, 0, ...reg.text);
          s.row = at;
          s.col = 0;
        } else {
          const at = cmd === "p" ? s.col + 1 : s.col;
          const l = line();
          s.lines[s.row] = l.slice(0, at) + reg.text[0] + l.slice(at);
          s.col = at;
        }
        break;
      }
      case "i": this.snapshot(); s.mode = "INSERT"; break;
      case "a": this.snapshot(); s.mode = "INSERT"; s.col++; break;
      case "A": this.snapshot(); s.mode = "INSERT"; s.col = line().length; break;
      case "I": this.snapshot(); s.mode = "INSERT"; s.col = line().search(/\S|$/); break;
      case "o": this.snapshot(); s.lines.splice(s.row + 1, 0, ""); s.row++; s.col = 0; s.mode = "INSERT"; break;
      case "O": this.snapshot(); s.lines.splice(s.row, 0, ""); s.col = 0; s.mode = "INSERT"; break;
      case "u": {
        const u = this.undo.pop();
        if (u) Object.assign(s, { lines: u.lines, row: u.row, col: u.col });
        break;
      }
      case "Escape": break;
      default:
        if (cmd.startsWith("r") && cmd.length === 2) {
          this.snapshot();
          const l = line();
          if (s.col + count <= l.length) s.lines[s.row] = l.slice(0, s.col) + cmd[1].repeat(count) + l.slice(s.col + count);
          break;
        }
        this.clamp();
        return false;
    }
    this.clamp();
    return true;
  }

  private insertKey(k: string): boolean {
    const s = this.s;
    const l = s.lines[s.row];
    if (k === "Escape") {
      s.mode = "NORMAL";
      s.col--;
    } else if (k === "Backspace") {
      if (s.col > 0) {
        s.lines[s.row] = l.slice(0, s.col - 1) + l.slice(s.col);
        s.col--;
      }
    } else if (k === "Enter") {
      s.lines[s.row] = l.slice(0, s.col);
      s.lines.splice(s.row + 1, 0, l.slice(s.col));
      s.row++;
      s.col = 0;
    } else if (k.length === 1) {
      s.lines[s.row] = l.slice(0, s.col) + k + l.slice(s.col);
      s.col++;
    } else return false;
    this.clamp();
    return true;
  }
}
