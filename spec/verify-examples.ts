// Replays each example Puzzle's optimal Solution through headless Neovim
// (driven via a pty, since nvim_feedkeys misbehaves for macro recording in
// scripted/headless mode) with the engine's fixed option profile, and
// checks it lands on target.
import { execSync, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";

// Translate our key-notation (e.g. "<Esc>", "<C-a>", "<CR>") into raw bytes a pty expects.
const SPECIAL: Record<string, string> = {
  Esc: "\x1b",
  CR: "\r",
  BS: "\x7f",
};

function toRawBytes(optimal: string): Buffer {
  const out: number[] = [];
  let i = 0;
  while (i < optimal.length) {
    if (optimal[i] === "<") {
      const close = optimal.indexOf(">", i);
      if (close > i) {
        const token = optimal.slice(i + 1, close);
        if (token in SPECIAL) {
          for (const ch of SPECIAL[token]) out.push(ch.charCodeAt(0));
        } else if (/^C-(.)$/i.test(token)) {
          const ch = token[2].toLowerCase();
          out.push(ch.charCodeAt(0) - 96); // Ctrl-a = 0x01, etc.
        } else {
          throw new Error(`unknown token <${token}>`);
        }
        i = close + 1;
        continue;
      }
    }
    out.push(optimal.charCodeAt(i));
    i++;
  }
  return Buffer.from(out);
}

function verify(id: string, start: string[], target: string[], cursor: { line: number; col: number }, optimal: string): Promise<{ ok: boolean; got: string[]; mode: string }> {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), "puzzle-verify-"));
    const startFile = join(dir, "start.txt");
    const outFile = join(dir, "out.txt");
    writeFileSync(startFile, start.join("\n") + (start.length ? "\n" : ""));

    // vim-pty: a tiny node pty via `script`/`unbuffer` isn't guaranteed present, so
    // shell out to python3's pty module, which is reliably available here.
    const py = `
import pty, os, time, sys
master, slave = pty.openpty()
import subprocess
p = subprocess.Popen(["nvim", "--clean", ${JSON.stringify(startFile)}], stdin=slave, stdout=slave, stderr=slave)
time.sleep(0.6)
cur_line, cur_col = ${cursor.line}, ${cursor.col}
# fixed option profile, per the engine ADR
os.write(master, b":set shiftwidth=2 expandtab noignorecase wrapscan nostartofline\\r")
time.sleep(0.2)
# move cursor to start position precisely via an ex command, not keys (keeps cursor-placement out of the measured keys)
os.write(master, (":call cursor(%d,%d)\\r" % (cur_line+1, cur_col+1)).encode())
time.sleep(0.3)
os.read(master, 65536)
raw = sys.stdin.buffer.read()
os.write(master, raw)
time.sleep(0.6)
os.write(master, b":call writefile([mode()], '${outFile}.mode')\\r")
time.sleep(0.2)
os.write(master, b":w! ${outFile}\\r")
time.sleep(0.3)
os.write(master, b":qa!\\r")
time.sleep(0.4)
try:
    p.wait(timeout=5)
except Exception:
    p.kill()
`;
    const pyFile = join(dir, "run.py");
    writeFileSync(pyFile, py);
    const child = spawn("python3", ["-I", pyFile], { cwd: dir });
    child.stdin.write(toRawBytes(optimal));
    child.stdin.end();
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", () => {
      if (!existsSync(outFile)) {
        rmSync(dir, { recursive: true, force: true });
        reject(new Error(`no output written for ${id}: ${stderr}`));
        return;
      }
      const got = readFileSync(outFile, "utf8").replace(/\n$/, "").split("\n");
      const mode = existsSync(outFile + ".mode") ? readFileSync(outFile + ".mode", "utf8").trim() : "?";
      rmSync(dir, { recursive: true, force: true });
      resolve({ ok: got.join("\n") === target.join("\n") && mode === "n", got, mode });
    });
  });
}

const dir = join(import.meta.dirname, "example-puzzles");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "types.ts");

let failed = 0;
for (const file of files) {
  const mod = await import(join(dir, file));
  const p = mod.default;
  const r = await verify(p.id, p.start, p.target, p.cursor, p.optimal);
  if (r.ok) {
    console.log(`OK   ${p.id}`);
  } else {
    failed++;
    console.log(`FAIL ${p.id} (mode=${r.mode})`);
    console.log("  got:", JSON.stringify(r.got));
    console.log("  want:", JSON.stringify(p.target));
  }
}
if (failed > 0) {
  console.log(`\n${failed}/${files.length} failed`);
  process.exit(1);
} else {
  console.log(`\nall ${files.length} passed`);
}
