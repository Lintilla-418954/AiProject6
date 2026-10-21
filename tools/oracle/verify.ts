import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const corpusPath = fileURLToPath(new URL("./corpus.json", import.meta.url));
if (!existsSync(corpusPath)) throw new Error("Missing committed oracle corpus");

try {
  const version = execFileSync("nvim", ["--version"], {
    encoding: "utf8",
  }).split("\n")[0];
  console.log(`Oracle available: ${version}`);
  console.log(
    "Golden corpus is committed; full PTY regeneration is performed by CI.",
  );
} catch {
  console.log(
    "Neovim unavailable; committed golden corpus remains usable by local tests.",
  );
}
