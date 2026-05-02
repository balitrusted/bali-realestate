/**
 * Normalizes glossary entry titles to a single concise term:
 * strips everything after em dash " — " or ASCII " - " in title lines.
 * Run: node scripts/glossary-strip-emdash-titles.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "glossary", "index.ts");
let s = fs.readFileSync(file, "utf8");

s = s.replace(/\r\n/g, "\n");

// Remove duplicate glossary-banjar-fee-iuran if present (legacy)
s = s.replace(
  /\n  \{\n    id: "glossary-banjar-fee-iuran",[\s\S]*?\n  \},\n(?=\n  \{\n    id: "glossary-ceremony-traffic")/,
  "\n"
);

let n = 0;
const stripSuffix = (pattern) => {
  const before = s;
  s = s.replace(pattern, (...args) => {
    const indentAndOpen = args[1];
    const left = args[2];
    const closing = args[args.length - 3]; // ", or ";
    n++;
    return `${indentAndOpen}${left}${closing}`;
  });
  return before !== s;
};

// title: "English — Indonesian",  → first segment only
stripSuffix(/^(\s*title: ")(.+?)( — .+)("(?:,\s*)?)$/gm);
stripSuffix(/^(\s*title: ")(.+?)( - .+)("(?:,\s*)?)$/gm);

fs.writeFileSync(file, s);
console.log("Done:", file, n ? `(${n} titles trimmed)` : "(no compound titles left)");
