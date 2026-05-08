import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

/**
 * DATA(data/) 폴더 안의 파일은 수정하지 않고,
 * 원본 total_kor_multiturn_counsel_bot.jsonl → finetune jsonl로 변환합니다.
 *
 * 변경 정책:
 * - "반말 변환(치환/강제)" 로직은 사용하지 않습니다.
 * - 대신 반말 모드(casual_friend)에서는 system prompt로만 "반말로 답해"를 지시합니다.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const src = path.join(root, "total_kor_multiturn_counsel_bot.jsonl");
const outDir = path.join(root, "data");
fs.mkdirSync(outDir, { recursive: true });

// ASCII-only names: avoids Windows/editor encoding issues
const outFtPolite = path.join(outDir, "matey_counsel_multiturn_finetune_polite.jsonl");
const outFtCasual = path.join(outDir, "matey_counsel_multiturn_finetune_casual.jsonl");

const BOT_NAME_PLACEHOLDER = "{bot_name}";
const NICKNAME_PLACEHOLDER = "{nickname}";

const SYSTEM_PROMPT_POLITE =
  `너는 ${BOT_NAME_PLACEHOLDER}야. (Matey 서비스의 대화 봇)` +
  " 말투는 너무 딱딱하지 않은 '친구 같은 존댓말'로 해." +
  ` 상담소/상담사 같은 표현은 쓰지 말고, ${NICKNAME_PLACEHOLDER}가 놀러 와서 얘기 나누는 느낌으로 대해.` +
  " 공감과 대화가 우선이고, 단정/훈계/과한 처방은 피해." +
  " 위험하거나 위급한 상황이면 전문기관 도움을 권유해.";

// 반말 모드: 변환(치환)하지 않고, 지시문으로만 반말을 강제
const SYSTEM_PROMPT_CASUAL =
  `너는 ${BOT_NAME_PLACEHOLDER}야. (Matey 서비스의 대화 봇)` +
  " 말투는 반말(친근한 친구 말투)로 해." +
  " 사용자가 존댓말을 쓰더라도 너는 끝까지 반말로만 말해." +
  ` 상담소/상담사/내담자 같은 표현은 쓰지 말고, ${NICKNAME_PLACEHOLDER}가 놀러 와서 얘기 나누는 느낌으로 대해.` +
  " 공감과 대화가 우선이고, 단정/훈계/과한 처방은 피하고, 위험하거나 위급한 상황이면 전문기관 도움을 권유해.";

function cleanText(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalizeRole(speaker) {
  if (speaker === "상담사") return "assistant";
  if (speaker === "내담자") return "user";
  return null;
}

function rewriteNoCounselWords(s) {
  // 상담 역할/기관 표현만 최소 치환 (반말/존댓말 변환 아님)
  return s
    .replaceAll("심리상담소", "여기")
    .replaceAll("상담소", "여기")
    .replaceAll("상담실", "여기")
    .replaceAll("상담센터", "")
    .replaceAll("심리센터", "")
    .replaceAll("대화센터", "")
    .replaceAll("센터", "")
    .replaceAll("상담자", "")
    .replaceAll("심리상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("심리 상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("내담자", "");
}

function toFtMessages(turns) {
  const messages = [];
  for (const t of turns) {
    const role = normalizeRole(t?.speaker);
    if (!role) continue;
    const raw = cleanText(t?.utterance);
    if (!raw) continue;
    messages.push({ role, content: rewriteNoCounselWords(raw) });
  }
  return messages;
}

async function main() {
  const rl = readline.createInterface({
    input: fs.createReadStream(src, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  const wPolite = fs.createWriteStream(outFtPolite, { encoding: "utf-8" });
  const wCasual = fs.createWriteStream(outFtCasual, { encoding: "utf-8" });

  let total = 0;
  let wrotePolite = 0;
  let wroteCasual = 0;
  let skipped = 0;

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;
    total += 1;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      skipped += 1;
      continue;
    }

    const turns = Array.isArray(obj?.turns) ? obj.turns : [];
    const ft = toFtMessages(turns);
    if (ft.length < 2) {
      skipped += 1;
      continue;
    }

    // polite_friend
    wPolite.write(
      JSON.stringify({
        messages: [{ role: "system", content: SYSTEM_PROMPT_POLITE }, ...ft],
        metadata: { tone: "polite_friend" },
      }) + "\n"
    );
    wrotePolite += 1;

    // casual_friend (banmal mode) — 변환 없이 지시만 추가
    wCasual.write(
      JSON.stringify({
        messages: [{ role: "system", content: SYSTEM_PROMPT_CASUAL }, ...ft],
        metadata: { tone: "casual_friend" },
      }) + "\n"
    );
    wroteCasual += 1;
  }

  await Promise.all([
    new Promise((r) => wPolite.end(r)),
    new Promise((r) => wCasual.end(r)),
  ]);

  console.log(
    JSON.stringify(
      {
        totalLines: total,
        wrote: { polite_friend: wrotePolite, casual_friend: wroteCasual },
        skipped,
        out: {
          polite: path.relative(root, outFtPolite),
          casual: path.relative(root, outFtCasual),
        },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

