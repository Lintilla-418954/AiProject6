import { puzzles } from "../src/content/index.ts";
import { puzzleInventory, validateContent } from "../src/content/validate.ts";

const replay = process.argv.includes("--replay");
const report = process.argv.includes("--report");
const issues = validateContent(puzzles, { replay });
if (report) {
  console.table(
    puzzleInventory(puzzles).map((row) => ({
      ...row,
      trace: row.trace.join(" "),
    })),
  );
}
if (issues.length) {
  for (const issue of issues)
    console.error(`FAIL ${issue.puzzleId}: ${issue.message}`);
  console.error(`\n${issues.length} validation issue(s)`);
  process.exitCode = 1;
} else
  console.log(
    `OK ${puzzles.length} Puzzles${replay ? " with engine replay" : ""}`,
  );
