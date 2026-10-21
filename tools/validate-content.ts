import { puzzles } from "../src/content/index.ts";
import { validateContent } from "../src/content/validate.ts";

const replay = process.argv.includes("--replay");
const issues = validateContent(puzzles, { replay });
if (issues.length) {
  for (const issue of issues)
    console.error(`FAIL ${issue.puzzleId}: ${issue.message}`);
  console.error(`\n${issues.length} validation issue(s)`);
  process.exitCode = 1;
} else
  console.log(
    `OK ${puzzles.length} Puzzles${replay ? " with engine replay" : ""}`,
  );
