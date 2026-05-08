import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
// Source must be JSONL where each line has metadata.tone === "polite_friend" | "casual_friend"
// (e.g. an older combined export). Prefer: node scripts/convert_counsel_jsonl.mjs — writes split files directly.
const src = path.join(root, "data", "matey_counsel_multiturn_finetune.jsonl");
const outPolite = path.join(root, "data", "matey_counsel_multiturn_finetune_polite.jsonl");
const outCasual = path.join(root, "data", "matey_counsel_multiturn_finetune_casual.jsonl");

async function main() {
  const wPolite = fs.createWriteStream(outPolite, { encoding: "utf-8" });
  const wCasual = fs.createWriteStream(outCasual, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fs.createReadStream(src, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let total = 0;
  let polite = 0;
  let casual = 0;
  let unknown = 0;

  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    total += 1;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      unknown += 1;
      continue;
    }
    const tone = obj?.metadata?.tone;
    if (tone === "polite_friend") {
      wPolite.write(line + "\n");
      polite += 1;
    } else if (tone === "casual_friend") {
      wCasual.write(line + "\n");
      casual += 1;
    } else {
      unknown += 1;
    }
  }

  await Promise.all([
    new Promise((r) => wPolite.end(r)),
    new Promise((r) => wCasual.end(r)),
  ]);

  console.log(JSON.stringify({ totalLines: total, polite_friend: polite, casual_friend: casual, skipped: unknown }, null, 2));
  console.log(outPolite);
  console.log(outCasual);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
