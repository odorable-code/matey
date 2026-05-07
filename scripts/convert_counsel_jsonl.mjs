import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const src = path.join(root, "total_kor_multiturn_counsel_bot.jsonl");
const outDir = path.join(root, "data");
fs.mkdirSync(outDir, { recursive: true });

// ASCII-only names: avoids Windows / editor encoding issues with Korean filenames
// (e.g. empty or duplicate files like "matey_counsel_multiturn_finetune_諛섎쭚….jsonl").
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

const SYSTEM_PROMPT_CASUAL =
  `너는 ${BOT_NAME_PLACEHOLDER}야. (Matey 서비스의 대화 봇)` +
  " 말투는 반말(친근한 친구 말투)로 해." +
  " 사용자가 존댓말을 쓰더라도 너는 끝까지 반말로만 말해. 반존대(~요만 붙인 말, ~겠어?, ~군, 상사님/교수님 호칭 등)도 쓰지 마." +
  ` 너와 ${NICKNAME_PLACEHOLDER}는 가족 관계가 아니야. 가족 이야기할 때 '우리 가족', '우리 부모님'처럼 봇까지 끼어 말하지 말고, ${NICKNAME_PLACEHOLDER}의 가족·${NICKNAME_PLACEHOLDER}네 부모님 등으로 구분하거나 그냥 '가족', '부모님'만 써.` +
  ` 상담소/상담사/내담자 같은 표현은 쓰지 말고, ${NICKNAME_PLACEHOLDER}가 놀러 와서 얘기 나누는 느낌으로 대해.` +
  " 공감과 대화가 우선이고, 단정/훈계/과한 처방은 피하고, 위험하거나 위급한 상황이면 전문기관 도움을 권유해.";

function cleanText(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalizeSender(speaker) {
  if (speaker === "상담사") return "BOT";
  if (speaker === "내담자") return "USER";
  return null;
}

function normalizeRole(speaker) {
  if (speaker === "상담사") return "assistant";
  if (speaker === "내담자") return "user";
  return null;
}

function rewriteNoCounselWords(s) {
  // Remove/replace hard counseling-role words and stiff institution framing.
  return s
    // place/institution framing
    .replaceAll("심리상담소", "여기")
    .replaceAll("상담소", "여기")
    .replaceAll("상담실", "여기")
    .replaceAll("대화센터", "")
    .replaceAll("상담센터", "")
    .replaceAll("심리센터", "")
    .replaceAll("센터", "")
    // role labels
    .replaceAll("상담자", "")
    .replaceAll("상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("심리상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("심리 상담사", BOT_NAME_PLACEHOLDER)
    .replaceAll("심리대화", "대화")
    .replaceAll("심리얘기", "얘기")
    .replaceAll("내담자", "");
}


function replaceStandaloneWord(input, word, replacement) {
  // Replace only when 'word' appears as a standalone token-ish unit.
  // This prevents accidental replacements like "너무" -> "{nickname}무".
  const boundary = /[\s"'“”‘’(){}\[\]<>.,!?…]/;
  const re = new RegExp(
    `(^|${boundary.source})${word}($|${boundary.source})`,
    "g"
  );
  return input.replace(re, (m, p1, p2) => `${p1}${replacement}${p2}`);
}

function rewriteNicknameAddressing(s, mode) {
  let out = s;

  // Fast-path for common glued honorific forms (avoids edge cases in boundary regex)
  out = out
    .replaceAll("님께서도", `${NICKNAME_PLACEHOLDER}도`)
    .replaceAll("님께서만", `${NICKNAME_PLACEHOLDER}만`);

  // Replace second-person addressing with nickname placeholder.
  if (mode === "polite") {
    out = out.replaceAll("당신", NICKNAME_PLACEHOLDER);
  }

  // Remove any remaining honorific artifacts like "님", "님께서" etc.
  out = out
    // only replace when '님...' starts as a token (won't touch '부모님', '교수님' etc)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])너님($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님의($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}의$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님도($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}도$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님만($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}만$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님께서도($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}도$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님께서만($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}만$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님께서는($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}는$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님께서($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}가$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님이($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}가$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님은($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}는$2`)
    .replace(new RegExp(`(^|[\\s"'“”‘’(){}\\[\\]<>.,!?…])님께($|[\\s"'“”‘’(){}\\[\\]<>.,!?…])`, "g"), `$1${NICKNAME_PLACEHOLDER}에게$2`);

  // Avoid distancing/customer-like nouns. If the assistant is addressing the other party,
  // always use nickname placeholder (service will fill it).
  const addressingTerms = [
    "고객님",
    "고객",
    "사용자님",
    "사용자",
    "회원님",
    "회원",
    "방문자",
    "참여자",
    "상대방",
    "상대",
    // NOTE: '분' alone is too ambiguous (e.g. 분위기). handle only common addressing forms below.
    "분들",
    "여러분",
    "여러분들",
  ];
  for (const term of addressingTerms) {
    out = replaceStandaloneWord(out, term, NICKNAME_PLACEHOLDER);
  }

  // Handle common particle-attached addressing forms (여러분의/여러분이/여러분은/분들께서...)
  const particleForms = [
    "여러분의",
    "여러분이",
    "여러분은",
    "여러분을",
    "여러분도",
    "여러분께",
    "여러분께서",
    "여러분에게",
    "분들의",
    "분들이",
    "분들은",
    "분들을",
    "분들도",
    "분들께",
    "분들께서",
    "분들에게",
  ];
  for (const form of particleForms) {
    out = out.replaceAll(form, NICKNAME_PLACEHOLDER);
  }

  // If "당신" is still present (e.g. casual branch), normalize it too.
  out = replaceStandaloneWord(out, "당신", NICKNAME_PLACEHOLDER);

  return out;
}

function sanitizePrivateNames(input) {
  let s = input;
  // Masked/anonymous names should not appear in training data
  // Replace them with {nickname} so the app can fill a real visible name.
  s = replaceStandaloneWord(s, "OO", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("OO라는", `${NICKNAME_PLACEHOLDER}라는`);
  s = s.replaceAll("OO 라는", `${NICKNAME_PLACEHOLDER}라는`);
  s = replaceStandaloneWord(s, "ㅇㅇ", NICKNAME_PLACEHOLDER);
  s = replaceStandaloneWord(s, "XX", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("이아무개", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("아무개", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("익명", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("비공개", NICKNAME_PLACEHOLDER);
  // Empty quoted name like '' or "" -> {nickname}
  s = s.replaceAll("''", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("\"\"", NICKNAME_PLACEHOLDER);

  // Latin X masks: XXX / XXXX / XX... or "이XX"
  s = s.replace(/\bX{2,}\b/g, NICKNAME_PLACEHOLDER);
  s = s.replace(/([가-힣])X{2,}/g, `$1${NICKNAME_PLACEHOLDER}`);
  return s;
}

function rewritePoliteFriend(text) {
  let s = rewriteNoCounselWords(text);
  s = sanitizePrivateNames(s);

  // Replace "내담자님" type leftovers before generic trimming
  s = s.replaceAll("내담자님", "당신");

  // 상담/면담 같은 단어를 "얘기"로 통일 (1:1 친구 채팅 톤)
  s = s.replaceAll("면담", "얘기");
  s = s.replaceAll("상담", "얘기");
  // 위 치환으로 "심리상담" → "심리얘기"가 생길 수 있어 한 번 더 정리
  s = s.replaceAll("심리얘기", "얘기");

  // Replace "심리상담" framing
  s = s
    .replaceAll("심리상담", "대화")
    .replaceAll("상담을 시작", "얘기해볼까요")
    .replaceAll("상담을 시작하겠습니다", "얘기해볼까요")
    .replaceAll("상담을 시작할게요", "얘기해볼까요");

  // A few high-frequency stiff phrases → softer polite
  s = s
    .replaceAll("그렇습니다.", "맞아요.")
    .replaceAll("그렇습니다", "맞아요")
    .replaceAll("좋습니다.", "좋아요.")
    .replaceAll("좋습니다", "좋아요")
    .replaceAll("이해했습니다.", "알겠어요.")
    .replaceAll("이해했습니다", "알겠어요")
    .replaceAll("감사합니다.", "고마워요.")
    .replaceAll("감사합니다", "고마워요");

  // Fix awkward concatenations introduced by replacements
  s = s
    .replaceAll("얘기해볼까요하기 전에", "얘기하기 전에")
    .replaceAll("얘기해볼까요하기", "얘기하기")
    .replaceAll("대화을", "대화를")
    .replaceAll("얘기을", "얘기를");

  // Make the very common opener friendlier
  s = s.replaceAll("무엇이 불편하시나요?", "어떤 점이 불편하세요?");
  s = s.replaceAll("무엇이 괴로우신가요?", "어떤 게 힘드세요?");
  s = s.replaceAll("무엇이 괴로우시죠?", "어떤 게 힘드세요?");
  s = s.replaceAll("지금부터 대화를 시작하겠습니다.", "얘기해볼까요?");
  s = s.replaceAll("지금부터 대화를 시작하겠습니다", "얘기해볼까요");
  s = s.replaceAll("지금부터 얘기를 시작하겠습니다.", "얘기해볼까요?");
  s = s.replaceAll("지금부터 얘기를 시작하겠습니다", "얘기해볼까요");
  s = s.replaceAll("메이티", BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`심리${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll("여러분만의", "우리만의");
  s = s.replaceAll("여러분의", `${NICKNAME_PLACEHOLDER}의`);
  s = s.replaceAll("여러분", NICKNAME_PLACEHOLDER);

  // Kill "센터/전문가/절차 안내" 같은 공지형 오프닝
  s = s.replace(
    /^안녕하세요\.\s*여기는\s*AI\s*대화센터입니다\.\s*심리{bot_name}입니다\./,
    `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`
  );
  s = s.replace(
    /^안녕하세요\.\s*여기는\s*AI\s*대화센터입니다\.\s*{bot_name}입니다\./,
    `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`
  );
  s = s.replace(/^안녕하세요\.\s*여기는.*?입니다\./, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/^안녕하세요\.\s*오늘 상담을 맡은\s*{bot_name}입니다\.?/, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/^안녕하세요\.\s*오늘 대화를 맡은\s*{bot_name}입니다\.?/, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/^안녕하세요\.\s*오늘\s*{nickname}와\s*함께하게 된\s*{bot_name}입니다\.?/, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(
    /^안녕하세요\.\s*저는\s*{bot_name}이고,?\s*지금부터\s*함께\s*대화를\s*시작.*$/,
    `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요. 얘기해볼까요?`
  );
  s = s.replaceAll("지금부터 저희 함께", "우리 같이");
  s = s.replaceAll("진행해보려고 합니다", "얘기해보려고 해요");

  // Remove self-intro that sounds like a professional counselor
  s = s.replace(/^안녕하세요\.\s*메이티입니다\.?/, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/^안녕하세요,?\s*이곳은\s*여기입니다\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/^안녕하세요\.\s*메이티입니다\./, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("전 전문 심리메이티입니다.", `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("저는 전문 심리메이티입니다.", `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}입니다.`, `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}입니다`, `저는 ${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}입니다.`, `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}입니다`, `저는 ${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 입니다.`, `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 입니다`, `저는 ${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 이에요.`, `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 이에요`, `저는 ${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}예요.`, `저는 ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}예요`, `저는 ${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll(`안녕하세요. 오늘 얘기를 맡은 ${BOT_NAME_PLACEHOLDER}입니다.`, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/오늘 얘기[를을] 맡(은|게 된|게된)\s*\{bot_name\}입니다\.?/g, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/오늘 얘기[를을] 맡(은|게 된|게된)\s*\{bot_name\}예요\.?/g, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replace(/오늘 얘기[를을] 맡(은|게 된|게된)\s*\{bot_name\}야\.?/g, `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("오늘 얘기에 참여해주셔서", "와줘서");
  s = s.replaceAll("참여해주셔서", "와줘서");
  s = s.replaceAll("참여해 주셔서", "와줘서");
  s = s.replaceAll("얘기 목적과 이유", "왜 왔는지");
  s = s.replaceAll("이제부터 제가 최대한", "내가 최대한");
  s = s.replaceAll("오늘 얘기를 맡게된 것 같습니다.", `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("오늘 얘기를 맡게된 것 같습니다", `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("오늘 얘기를 맡게 된 것 같습니다.", `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll("오늘 얘기를 맡게 된 것 같습니다", `안녕하세요! ${BOT_NAME_PLACEHOLDER}예요.`);

  s = rewriteNicknameAddressing(s, "polite");
  return s.trim();
}

function forcePoliteOnly(text) {
  let s = text;
  // 반말/비격식 잔재 제거 (polite_friend는 끝까지 존댓말 고정)
  s = s.replaceAll("안녕!", "안녕하세요!");
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}야.`, `${BOT_NAME_PLACEHOLDER}예요.`);
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}야`, `${BOT_NAME_PLACEHOLDER}예요`);
  s = s.replaceAll("해봐", "해보세요");
  s = s.replaceAll("해볼래?", "해볼까요?");
  s = s.replaceAll("괜찮아?", "괜찮아요?");
  s = s.replaceAll("말해줘", "말해줘요");
  s = s.replaceAll("도와줄게", "도와드릴게요");
  s = s.replaceAll("부탁할게", "부탁드릴게요");
  return s;
}

function rewriteUserUtterance(text) {
  let s = rewriteNoCounselWords(text);
  s = sanitizePrivateNames(s);
  // 유저 문장에서도 기관/전문가 프레이밍 단어는 제거해서 데이터 전체에서 어색함 최소화
  s = s.replaceAll("면담", "얘기");
  s = s.replaceAll("상담", "얘기");
  s = s.replaceAll("대화센터", "");
  s = s.replaceAll("상담센터", "");
  s = s.replaceAll("심리센터", "");
  s = s.replaceAll(`심리${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll("심리얘기", "얘기");
  s = s.replaceAll("여러분", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("대화을", "대화를");
  s = s.replaceAll("얘기을", "얘기를");
  // Placeholder 조립/중복 버그 정리 (유저 턴에서도 발생)
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}${NICKNAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replace(new RegExp(`\\${BOT_NAME_PLACEHOLDER}\\s*\\${NICKNAME_PLACEHOLDER}`, "g"), BOT_NAME_PLACEHOLDER);
  s = s.replace(new RegExp(`\\${NICKNAME_PLACEHOLDER}\\s*\\${NICKNAME_PLACEHOLDER}`, "g"), NICKNAME_PLACEHOLDER);
  s = s.replaceAll(`전문${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`전문 ${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  return s.trim();
}

/** casual_friend 데이터: 내담자 턴도 친구 채팅처럼 반말·1인칭 통일 */
function rewriteUserUtteranceCasual(text) {
  let s = rewriteUserUtterance(text);

  s = replaceStandaloneWord(s, "제게", "나한테");
  s = replaceStandaloneWord(s, "저에게", "나한테");
  s = replaceStandaloneWord(s, "제가", "내가");
  s = replaceStandaloneWord(s, "저는", "나는");
  s = replaceStandaloneWord(s, "저도", "나도");
  s = replaceStandaloneWord(s, "저를", "나를");
  s = replaceStandaloneWord(s, "저의", "내");
  s = s
    .replaceAll("제 일", "내 일")
    .replaceAll("제 삶", "내 삶")
    .replaceAll("제 자신", "나 자신")
    .replaceAll("제 직장", "내 직장")
    .replaceAll("제 회사", "내 회사")
    .replaceAll("제 전공", "내 전공")
    .replaceAll("제 직무", "내 직무")
    .replaceAll("제 실력", "내 실력")
    .replaceAll("제 동료", "내 동료")
    .replaceAll("제 상사", "내 상사")
    .replaceAll("제 팀", "내 팀")
    .replaceAll("저희 회사", "우리 회사")
    .replaceAll("저희 ", "우리 ");

  s = s.replaceAll("저만", "나만");

  s = rewriteNicknameAddressing(s, "casual");
  s = stripWorkplaceTitlesForCasual(s);

  s = forceCasualOnly(forceCasualOnly(s));
  s = polishCasualUserKorean(s);
  return s.trim();
}

function polishCasualUserKorean(s) {
  let t = s;
  t = t
    .replaceAll("드리고 있", "주고 있")
    .replaceAll("드려서", "줘서")
    .replaceAll("드릴 ", "줄 ")
    .replaceAll("아뇨", "아니")
    .replaceAll("네,", "응,")
    .replaceAll("예,", "응,");

  t = t
    .replaceAll("얘기해 주시면", "얘기해 주면")
    .replaceAll("말해 주시면", "말해 주면")
    .replaceAll("알려 주시면", "알려 주면")
    .replaceAll("그러십니다", "그래")
    .replaceAll("하십니다", "해")
    .replaceAll("하십니까", "해?")
    .replaceAll("느낍니다", "느껴")
    .replaceAll("말줄게", "말해줄게")
    .replaceAll("그럼 저.", "그럼 나.")
    .replaceAll("그럼 저 ", "그럼 나 ");

  t = t.replaceAll("걱정하지 안 ", "걱정 안 ");
  t = t
    .replaceAll("거예.", "거야.")
    .replaceAll("거예?", "거야?")
    .replaceAll("거예 ", "거야 ")
    .replaceAll("질문이에.", "질문이야.")
    .replaceAll("시간이에.", "시간이야.")
    .replaceAll("걱정이에.", "걱정돼.")
    .replaceAll("걱정이에 ", "걱정돼 ");

  t = t
    .replaceAll("해주시면 감사", "해주면 고마워")
    .replaceAll("그렇게 해주시면", "그렇게 해줘")
    .replaceAll("제 손", "내 손")
    .replaceAll("제 친구", "내 친구")
    .replaceAll("제 발언", "내 발언")
    .replaceAll("제 역량", "내 역량")
    .replaceAll("말하신 대로", "말한 대로")
    .replaceAll("나옵니다", "나와")
    .replaceAll("못할게어", "못하겠어")
    .replaceAll("집니다", "져")
    .replaceAll("듭니다", "들어");

  t = t.replace(/^저,\s*/, "나, ");

  t = t
    .replaceAll("나쁘지 않습니다만", "나쁘지 않은데")
    .replaceAll("넘어가버립니다", "넘어가버려");

  t = t
    .replaceAll("봅시다", "보자")
    .replaceAll("합시다", "하자");
  t = t.replaceAll("것이야", "거야");
  t = t
    .replaceAll("많으시다면", "많다면")
    .replaceAll("많으시면", "많으면")
    .replaceAll("줍니다", "줘")
    .replaceAll("뜹니다", "떠")
    .replaceAll("생깁니다", "생겨")
    .replaceAll("제 심리", "내 심리")
    .replaceAll("제 생각", "내 생각")
    .replaceAll("제 얘기", "내 얘기")
    .replaceAll("저보고", "나보고")
    .replaceAll("일을 해오시다가", "일을 해오다가")
    .replaceAll("제 부모님", "내 부모님")
    .replaceAll("제 모든 것을", "내 모든 것을")
    .replaceAll("전 이미", "난 이미");

  return t;
}

function rewriteCasualFriend(text) {
  let s = rewriteNoCounselWords(text);
  s = sanitizePrivateNames(s);

  s = s.replaceAll("내담자님", "너");

  s = s
    .replaceAll("심리상담", "얘기")
    .replaceAll("상담을 시작", "얘기해보자")
    .replaceAll("상담을 시작하겠습니다", "얘기해보자")
    .replaceAll("상담을 시작할게요", "얘기해보자");

  // Soften & casualize a few frequent formal phrases
  s = s
    .replaceAll("그렇습니다.", "맞아.")
    .replaceAll("그렇습니다", "맞아")
    .replaceAll("좋습니다.", "좋아.")
    .replaceAll("좋습니다", "좋아")
    .replaceAll("이해했습니다.", "알겠어.")
    .replaceAll("이해했습니다", "알겠어")
    .replaceAll("감사합니다.", "고마워.")
    .replaceAll("감사합니다", "고마워")
    .replaceAll("괜찮습니다.", "괜찮아.")
    .replaceAll("괜찮습니다", "괜찮아");

  s = s
    .replaceAll("얘기해보자하기 전에", "얘기하기 전에")
    .replaceAll("얘기해보자하기", "얘기하기")
    .replaceAll("대화을", "대화를")
    .replaceAll("얘기을", "얘기를");

  s = s
    .replaceAll("무엇이 불편하시나요?", "무슨 일 있어?")
    .replaceAll("어떤 고민으로 오셨나요?", "무슨 일로 왔어?")
    .replaceAll("어떤 고민이 있으신가요?", "무슨 고민 있어?");
  s = s.replaceAll("무엇이 괴로우신가요?", "뭐가 힘들어?");
  s = s.replaceAll("무엇이 괴로우시죠?", "뭐가 힘들어?");
  s = s.replaceAll("메이티", BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`심리${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`심리 ${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll("여러분만의", "우리만의");
  s = s.replaceAll("여러분", NICKNAME_PLACEHOLDER);
  s = s.replaceAll("심리얘기", "얘기");

  // 상담/면담 같은 단어를 "얘기"로 통일 (친구 채팅 톤)
  s = s.replaceAll("면담", "얘기");
  s = s.replaceAll("상담", "얘기");
  // 위 치환으로 "심리상담" → "심리얘기"가 생길 수 있어 한 번 더 정리
  s = s.replaceAll("심리얘기", "얘기");

  // ===== Casual tone hardening (remove half-polite) =====
  // Greeting / self-intro
  s = s.replace(/^안녕하세요[.!]?/, "안녕!");
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}입니다.`, `${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}입니다`, `${BOT_NAME_PLACEHOLDER}야`);

  // Pronouns / addressing
  s = replaceStandaloneWord(s, "제게", "나한테");
  s = replaceStandaloneWord(s, "저에게", "나한테");
  s = replaceStandaloneWord(s, "제가", "내가");
  s = replaceStandaloneWord(s, "저는", "나는");
  s = replaceStandaloneWord(s, "저도", "나도");
  s = replaceStandaloneWord(s, "저를", "나를");

  // Common polite phrases → casual
  s = s.replaceAll("말씀해 주세요", "말해줘");
  s = s.replaceAll("말씀해주세요", "말해줘");
  s = s.replaceAll("말씀해주실 수 있을까요?", "말해줄 수 있어?");
  s = s.replaceAll("말씀해주실 수 있나요?", "말해줄 수 있어?");
  s = s.replaceAll("말씀해 주실 수 있나요?", "말해줄 수 있어?");
  s = s.replaceAll("괜찮겠나요?", "괜찮아?");
  s = s.replaceAll("괜찮겠어요?", "괜찮아?");
  s = s.replaceAll("해보시겠어요?", "해볼래?");
  s = s.replaceAll("해보시겠습니까?", "해볼래?");
  s = s.replaceAll("해보세요.", "해봐.");
  s = s.replaceAll("해보세요", "해봐");
  s = s.replaceAll("해보시는 건 어떨까요?", "해보는 건 어때?");
  s = s.replaceAll("해보시면", "해보면");
  s = s.replaceAll("해주시면", "해주면");
  s = s.replaceAll("도와드릴게요", "도와줄게");
  s = s.replaceAll("도와드릴 수", "도와줄 수");
  s = s.replaceAll("부탁드립니다", "부탁할게");
  s = s.replaceAll("감사합니다", "고마워");
  s = s.replaceAll("고마워요", "고마워");

  // Honorific endings → casual-ish endings
  s = s.replaceAll("있으신가요?", "있어?");
  s = s.replaceAll("계신가요?", "있어?");
  s = s.replaceAll("있나요?", "있어?");
  s = s.replaceAll("되셨나요?", "됐어?");
  s = s.replaceAll("하셨나요?", "했어?");
  s = s.replaceAll("하시는 건가요?", "하는 거야?");
  s = s.replaceAll("하시는 거예요?", "하는 거야?");
  s = s.replaceAll("건가요?", "거야?");
  s = s.replaceAll("인가요?", "야?");

  // Sentence-final politeness leftovers
  // Only adjust when it's clearly at the end of the utterance
  s = s.replace(/입니다\.$/, "이야.");
  s = s.replace(/입니다!$/, "이야!");
  s = s.replace(/입니다\?$/, "이야?");
  s = s.replace(/있습니다\.$/, "있어.");
  s = s.replace(/있습니다\?$/, "있어?");
  s = s.replace(/합니다\.$/, "해.");
  s = s.replace(/합니다\?$/, "해?");
  s = s.replace(/됩니다\.$/, "돼.");
  s = s.replace(/됩니다\?$/, "돼?");
  s = s.replace(/좋겠습니다\.$/, "좋겠다.");
  s = s.replace(/좋겠습니다\?$/, "좋겠어?");

  // Fix common "무엇/왜 ... 인가요?" forms (avoid corrupting other words)
  s = s.replaceAll("무엇인가요?", "뭐야?");
  s = s.replaceAll("무엇인가요", "뭐야");
  s = s.replaceAll("왜 그런 건가요?", "왜 그런 거야?");
  s = s.replaceAll("왜 그런가요?", "왜 그래?");

  // Honorific adjectives/particles often seen in assistant lines
  s = s.replaceAll("하셨죠?", "했지?");
  s = s.replaceAll("하셨죠.", "했지.");
  s = s.replaceAll("하셨죠", "했지");
  s = s.replaceAll("하셨는데", "했는데");
  s = s.replaceAll("하셨다", "했다");
  s = s.replaceAll("하셨", "했");
  s = s.replaceAll("하시는", "하는");
  s = s.replaceAll("하신", "한");
  s = s.replaceAll("하시", "해");
  s = s.replaceAll("증상이신", "증상인");
  s = s.replaceAll("어떠신", "어떤");
  s = s.replaceAll("재밌으신", "재밌는");

  s = s.replace(/^안녕하세요[.!]?\s*메이티입니다\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/^안녕하세요,?\s*메이티입니다\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/^안녕하세요,?\s*여기.*?입니다\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("전 전문 심리메이티입니다.", `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("저는 전문 심리메이티입니다.", `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}입니다.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}입니다`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}입니다.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER}입니다`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 입니다.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`저는 전문 ${BOT_NAME_PLACEHOLDER} 입니다`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}야.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`전 전문 ${BOT_NAME_PLACEHOLDER}야`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER}야.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER}야`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER} 입니다.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER} 입니다`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER}예요.`, `난 ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`나는 전문 ${BOT_NAME_PLACEHOLDER}예요`, `난 ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`오늘 얘기을 맡은 ${BOT_NAME_PLACEHOLDER}야.`, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll(`오늘 얘기를 맡은 ${BOT_NAME_PLACEHOLDER}야.`, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/오늘 얘기[를을] 맡(은|게 된|게된)\s*\{bot_name\}야\.?/g, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("오늘 얘기에 참여해주셔서", "와줘서");
  s = s.replaceAll("참여해주셔서", "와줘서");
  s = s.replaceAll("참여해 주셔서", "와줘서");
  s = s.replaceAll("얘기 목적과 이유", "왜 왔는지");
  s = s.replaceAll("오늘 얘기를 맡게된 것 같습니다.", `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("오늘 얘기를 맡게된 것 같습니다", `안녕! ${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll("오늘 얘기을 맡게된 것 같습니다.", `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("오늘 얘기을 맡게된 것 같습니다", `안녕! ${BOT_NAME_PLACEHOLDER}야`);

  // "대화센터/AI센터/절차 안내" 같은 공지형 오프닝 제거
  s = s.replace(
    /^안녕!\s*여기는\s*AI\s*얘기센터입니다\.\s*심리{bot_name}야\./,
    `안녕! ${BOT_NAME_PLACEHOLDER}야.`
  );
  s = s.replace(/^안녕!\s*여기는.*?야\./, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/^안녕!\s*오늘 상담을 맡은\s*{bot_name}야\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/^안녕!\s*오늘 대화를 맡은\s*{bot_name}야\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replace(/^안녕!\s*오늘\s*{nickname}와\s*함께하게 된\s*{bot_name}야\.?/, `안녕! ${BOT_NAME_PLACEHOLDER}야.`);
  s = s.replaceAll("지금부터 저희 함께", "우리 같이");
  s = s.replaceAll("진행해보려고 합니다", "얘기해보려고 해");

  // 캐주얼에서 문장 끝 "요" 잔재 최소화 (끝맺음만 조정)
  s = s.replace(/요\.$/, ".");
  s = s.replace(/요\?$/, "?");
  s = s.replace(/요!$/, "!");

  s = rewriteNicknameAddressing(s, "casual");
  // Placeholder 조립/중복 버그 정리
  // - "전문{bot_name}{nickname} {nickname}랑" 같은 케이스 방지
  s = s.replaceAll(`전문${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`전문 ${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}${NICKNAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`${NICKNAME_PLACEHOLDER}${NICKNAME_PLACEHOLDER}`, NICKNAME_PLACEHOLDER);
  s = s.replaceAll(`${NICKNAME_PLACEHOLDER} ${NICKNAME_PLACEHOLDER}`, NICKNAME_PLACEHOLDER);
  return s.trim();
}

function forceCasualOnly(text) {
  let s = text;
  // 존댓말 잔재를 반말로 강제 (casual_friend는 처음부터 끝까지 반말 고정)
  s = s.replaceAll("안녕하세요", "안녕");
  s = s.replaceAll("괜찮으신가요?", "괜찮아?");
  s = s.replaceAll("괜찮으신가?", "괜찮아?");
  s = s.replaceAll("괜찮으세요?", "괜찮아?");
  s = s.replaceAll("괜찮으세요", "괜찮아");
  s = s.replaceAll("어떠세요?", "어때?");
  s = s.replaceAll("어떠신가요?", "어때?");
  s = s.replaceAll("어떻게 생각하세요?", "어떻게 생각해?");
  s = s.replaceAll("말씀", "말");
  // 흔한 존대 동사/표현 → 반말
  s = s.replaceAll("계시", "있"); // 계시다(존대) → 있다
  s = s.replaceAll("그러시", "그래"); // 그러시다(존대) → 그러다/그렇다
  s = s.replaceAll("그러셨", "그랬");
  s = s.replaceAll("그러신", "그런");
  s = s.replaceAll("힘드시", "힘들");
  s = s.replaceAll("느끼시", "느끼");
  s = s.replaceAll("원하시", "원해");
  s = s.replaceAll("바라시", "바라");
  s = s.replaceAll("도움이 되시", "도움이 되");
  s = s.replaceAll("괜찮으시", "괜찮");
  s = s.replaceAll("있으시", "있");
  s = s.replaceAll("없으시", "없");
  // 보시-/하시-: 긴 결합부터 (보시면→봐면 오류, 수행하시고→수행해고 오류 방지)
  s = s.replaceAll("보시겠", "보겠");
  s = s.replaceAll("보시면", "보면");
  s = s.replaceAll("보시는", "보는");
  s = s.replaceAll("보시고", "보고");
  s = s.replaceAll("보시거나", "보거나");
  s = s.replaceAll("보시지만", "보지만");
  s = s.replaceAll("보시는데", "보는데");
  s = s.replaceAll("보셨", "봤");
  s = s.replaceAll("보시지", "보지");
  s = s.replaceAll("보시기", "보기");
  s = s.replaceAll("보시", "봐");
  s = s.replaceAll("하시겠", "하겠");
  s = s.replaceAll("하시면", "하면");
  s = s.replaceAll("하시는", "하는");
  s = s.replaceAll("하시고", "하고");
  s = s.replaceAll("하시거나", "하거나");
  s = s.replaceAll("하시지만", "하지만");
  s = s.replaceAll("하시는데", "하는데");
  s = s.replaceAll("하시니", "하니");
  s = s.replaceAll("하시니까", "하니까");
  s = s.replaceAll("하시죠", "하지");
  s = s.replaceAll("하시네", "하네");
  s = s.replaceAll("하시던", "하던");
  s = s.replaceAll("하시지", "하지");
  s = s.replaceAll("하시기", "하기");
  s = s.replaceAll("하시라", "해라");
  s = s.replaceAll("하시", "해");
  s = s.replaceAll("쓰시", "쓰");
  s = s.replaceAll("되시", "돼");
  s = s.replaceAll("이시", "이");
  s = s.replaceAll("이신", "인");
  s = s.replaceAll("이십", "이");
  s = s.replaceAll("겠죠", "겠지");
  // 어색한 잔재/혼용 제거
  s = s.replaceAll("무엇야", "뭐야");
  s = s.replaceAll("물론입니다", "물론이지");
  s = s.replaceAll("물론이죠", "물론이지");
  s = s.replaceAll("드릴게요", "줄게");
  s = s.replaceAll("드릴게", "줄게");
  s = s.replaceAll("도와드릴게요", "도와줄게");
  s = s.replaceAll("도와드리겠습니다", "도와줄게");
  s = s.replaceAll("도와드릴게", "도와줄게");
  s = s.replaceAll("들어드릴게요", "들어줄게");
  s = s.replaceAll("들어드릴게", "들어줄게");
  s = s.replaceAll("들어드리겠습니다", "들어줄게");
  s = s.replaceAll("들어드리겠", "들어줄게");
  s = s.replaceAll("부탁드립니다", "부탁할게");
  s = s.replaceAll("부탁드릴게요", "부탁할게");
  s = s.replaceAll("부탁드릴게", "부탁할게");
  s = s.replaceAll("부탁드립니다.", "부탁할게.");
  s = s.replaceAll("드립니다", "줘");
  s = s.replaceAll("드리겠습니다", "줄게");
  s = s.replaceAll("드리겠", "줄게");
  s = s.replaceAll("하겠습니다", "할게");
  s = s.replaceAll("하겠", "할게");
  s = s.replaceAll("해드릴게요", "해줄게");
  s = s.replaceAll("해드릴게", "해줄게");
  s = s.replaceAll("해드리겠습니다", "해줄게");
  s = s.replaceAll("알겠습니다", "알겠어");
  s = s.replaceAll("괜찮습니다", "괜찮아");
  s = s.replaceAll("고맙습니다", "고마워");
  s = s.replaceAll("감사합니다", "고마워");
  s = s.replaceAll("궁금합니다", "궁금해");
  s = s.replaceAll("중요합니다", "중요해");
  s = s.replaceAll("필요합니다", "필요해");
  // "~요" 체계적으로 제거 (토요일 같은 단어는 유지되도록 '종결' 패턴만)
  s = s.replace(/([가-힣])요(?=[\s.,!?…:;]|$)/g, "$1");
  s = s.replaceAll("같아요", "같아");
  s = s.replaceAll("있어요", "있어");
  s = s.replaceAll("없어요", "없어");
  s = s.replaceAll("했어요", "했어");
  s = s.replaceAll("됐어요", "됐어");
  s = s.replaceAll("좋아요", "좋아");
  s = s.replaceAll("고마워요", "고마워");
  // 자주 나오는 종결/어미
  s = s.replaceAll("주세요", "줘");
  s = s.replaceAll("주세", "줘"); // "주세." 같은 깨진 케이스
  s = s.replaceAll("하세요", "해");
  s = s.replaceAll("해요", "해");
  s = s.replaceAll("돼요", "돼");
  s = s.replaceAll("이에요", "이야");
  s = s.replaceAll("예요", "야");
  s = s.replaceAll("거예요?", "거야?");
  s = s.replaceAll("거예요", "거야");
  // "거예." / "거예" 잔재
  s = s.replace(/거예(?=[\s.,!?…:;'"”“‘’]|$)/g, "거야");
  // 문장 앞 "예," 접두(존댓말/공문체 잔재) 제거
  s = s.replace(/^\s*예,\s*/g, "응, ");
  s = s.replace(/^\s*예\.\s*/g, "응. ");
  // Placeholder 조립/중복 버그 정리 (force 단계에서 한 번 더 보증)
  s = s.replace(new RegExp(`\\${BOT_NAME_PLACEHOLDER}\\s*\\${NICKNAME_PLACEHOLDER}`, "g"), BOT_NAME_PLACEHOLDER);
  s = s.replace(new RegExp(`\\${NICKNAME_PLACEHOLDER}\\s*\\${NICKNAME_PLACEHOLDER}`, "g"), NICKNAME_PLACEHOLDER);
  s = s.replaceAll(`전문${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  s = s.replaceAll(`전문 ${BOT_NAME_PLACEHOLDER}`, BOT_NAME_PLACEHOLDER);
  // '습니다' 계열은 개별 문장 패턴으로만 안전하게 치환
  s = s.replaceAll("같습니다.", "같아.");
  s = s.replaceAll("같습니다", "같아");
  s = s.replaceAll("했습니다.", "했어.");
  s = s.replaceAll("했습니다", "했어");
  s = s.replaceAll("됩니다.", "돼.");
  s = s.replaceAll("됩니다", "돼");
  s = s.replaceAll("있습니다.", "있어.");
  s = s.replaceAll("있습니다", "있어");
  s = s.replaceAll("없습니다.", "없어.");
  s = s.replaceAll("없습니다", "없어");
  s = s.replaceAll("좋습니다.", "좋아.");
  s = s.replaceAll("좋습니다", "좋아");
  s = s.replaceAll("괜찮습니다.", "괜찮아.");
  s = s.replaceAll("괜찮습니다", "괜찮아");
  // "~합니다만" 같은 접속형 정리
  s = s.replace(/합니다만(?=[\s.,!?…:;'"”“‘’]|$)/g, "하는데");
  // 문장 어디에 있든 종결형 존대 문장(마침표/물음표/끝) 정리
  s = s.replace(/입니다\.(?=\s|$)/g, "이야.");
  s = s.replace(/입니다\?(?=\s|$)/g, "이야?");
  s = s.replace(/입니다!(?=\s|$)/g, "이야!");
  s = s.replace(/입니다(?=[\s.!?…]|$)/g, "이야");
  s = s.replace(/합니다\.(?=\s|$)/g, "해.");
  s = s.replace(/합니다\?(?=\s|$)/g, "해?");
  s = s.replace(/합니다!(?=\s|$)/g, "해!");
  s = s.replace(/합니다(?=[\s.!?…]|$)/g, "해");
  s = s.replace(/됩니다\.(?=\s|$)/g, "돼.");
  s = s.replace(/됩니다\?(?=\s|$)/g, "돼?");
  s = s.replace(/됩니다(?=[\s.!?…]|$)/g, "돼");
  s = s.replace(/있습니다\.(?=\s|$)/g, "있어.");
  s = s.replace(/있습니다\?(?=\s|$)/g, "있어?");
  s = s.replace(/있습니다(?=[\s.!?…]|$)/g, "있어");
  s = s.replace(/없습니다\.(?=\s|$)/g, "없어.");
  s = s.replace(/없습니다\?(?=\s|$)/g, "없어?");
  s = s.replace(/없습니다(?=[\s.!?…]|$)/g, "없어");
  // 치환 부작용/어색한 표기 정리
  s = s.replaceAll("들어봐겠어?", "들어볼래?");
  s = s.replaceAll("들어봐겠어", "들어볼래");
  s = s.replaceAll("궁금한 게 있면", "궁금한 게 있으면");
  s = s.replaceAll("걱정하지 마세", "걱정하지 마");
  s = s.replaceAll("시작해 보세", "시작해 봐");
  s = s.replaceAll("해보시는", "해보는");
  s = s.replaceAll("해보시", "해봐");
  // "~세?" / "~보세" 류 깨짐 방지
  s = s.replace(/([가-힣])세\?(?=[\s"'”’\\]|$)/g, "$1?");
  s = s.replace(/보세(?=[\s.!?…]|$)/g, "봐");
  // 남아있는 존대 표현(자주 나오는 것만) → 반말
  s = s.replaceAll("불편한 점이 있으신지", "불편한 점이 있는지");
  s = s.replaceAll("받으시러", "받으러");
  s = s.replaceAll("오셨", "왔");
  s = s.replaceAll("느끼신", "느낀");
  s = s.replaceAll("않으셔도", "안 해도");
  s = s.replaceAll("하셔도", "해도");
  s = s.replaceAll("해 주셔서", "해줘서");
  s = s.replaceAll("주셔서", "줘서");
  s = s.replaceAll("해봐는", "해보는");
  s = s.replaceAll("긴장하지 안", "긴장 안");

  // --- 추가: 스캔으로 잡힌 존댓말/격식 잔재 (긴 구문부터) ---
  s = s.replaceAll("생각해 보세요", "생각해 봐");
  s = s.replaceAll("다시한번 생각해 보세요", "다시 한번 생각해 봐");
  s = s.replaceAll("알려주시겠어", "알려줄래");
  s = s.replaceAll("말해주시겠어", "말해줄래");
  s = s.replaceAll("말해 주시겠어", "말해 줄래");
  s = s.replaceAll("더 구체적으로 말해주시겠어", "더 구체적으로 말해줄래");
  s = s.replaceAll("찾아주시기 바랍니다", "찾아줘");
  s = s.replaceAll("찾아주시기 바래", "찾아줘");
  s = s.replaceAll("바라겠습니다", "바랄게");
  s = s.replaceAll("바랍니다", "바래");
  s = s.replaceAll("하셔서", "해서");
  s = s.replaceAll("좋아지시길", "좋아지길");
  s = s.replaceAll("대처하셔야", "대처해야");
  s = s.replaceAll("혼자서 대처하셔야", "혼자서 대처해야");
  s = s.replaceAll("많으신 거죠", "많은 거지");
  s = s.replaceAll("많으신", "많은");
  s = s.replaceAll("어려우신", "어려운");
  s = s.replaceAll("힘드신", "힘든");
  s = s.replaceAll("어려우시죠", "어렵지");
  s = s.replaceAll("편하시죠", "편하지");
  s = s.replaceAll("그렇죠", "그치");
  s = s.replaceAll("당연한 것이죠", "당연한 거지");
  s = s.replaceAll("것이죠", "거지");
  s = s.replaceAll("이죠.", "이지.");
  s = s.replaceAll("이죠?", "이지?");
  s = s.replaceAll("이죠!", "이지!");
  s = s.replaceAll("이죠 ", "이지 ");
  s = s.replaceAll("찾아오신 거죠", "찾아온 거지");
  s = s.replaceAll("찾아오신", "찾아온");
  s = s.replaceAll("오셔서", "와서");
  s = s.replaceAll("오신", "온");
  s = s.replaceAll("가신다는", "간다는");
  s = s.replaceAll("안 가신다는", "안 간다는");
  s = s.replaceAll("느껴지시겠네", "느껴지겠네");
  s = s.replaceAll("힘들어지시겠어", "힘들어지겠어");
  s = s.replaceAll("지시겠어", "지겠어");
  s = s.replaceAll("우울해지신다고", "우울해진다고");
  s = s.replaceAll("해지신다고", "해진다고");
  s = s.replaceAll("지내신다는", "지낸다는");
  s = s.replaceAll("기분이 드시나", "기분 들어");
  s = s.replaceAll("드시나", "들어");
  s = s.replaceAll("드셨다고", "느꼈다고");
  s = s.replaceAll("있으셨군", "있었구나");
  s = s.replaceAll("힘드셨군", "힘들었구나");
  s = s.replaceAll("보내셨군", "보냈구나");
  s = s.replaceAll("이해가 잘 안 가신다는", "이해가 잘 안 간다는");
  s = s.replaceAll("말해 주신", "말해 준");
  s = s.replaceAll("주신 내용", "준 내용");
  s = s.replaceAll("지원해드리는", "지원해주는");
  s = s.replaceAll("지원해 드리는", "지원해주는");
  s = s.replaceAll("알려드릴 수 있는", "알려줄 수 있는");
  s = s.replaceAll("알려드릴", "알려줄");
  s = s.replaceAll("내가 알려드릴", "내가 알려줄");
  s = s.replaceAll("고민하고 지원해드리는", "고민하고 지원해주는");
  s = s.replace(/([가-힣]+)님께서/g, "$1님이");
  s = s.replaceAll("여쭤봐도", "물어봐도");
  s = s.replaceAll("여쭤봐", "물어봐");
  s = s.replaceAll("여쭤", "물어");
  s = s.replaceAll("뵈어", "봐");
  s = s.replaceAll("뵈", "봐");
  // "드리-" 격식 잔재
  s = s.replaceAll("조언을 드릴 수", "조언해줄 수");
  s = s.replaceAll("조언을 드릴", "조언해줄");
  s = s.replaceAll("연락을 드렸어", "연락했어");
  s = s.replaceAll("연락 드렸어", "연락했어");
  s = s.replaceAll("생각해 보겠습니까", "뭐 더 생각해볼까");
  s = s.replaceAll("겠습니까", "겠어");
  s = s.replaceAll("일입니까", "일이야");
  s = s.replaceAll("입니까", "야?");
  s = s.replaceAll("보세요", "봐");
  s = s.replaceAll("해보세요", "해봐");
  s = s.replaceAll("이셨", "였");
  s = s.replaceAll("하셨", "했");
  // 남는 ～습니다 계열(중간/끝, 따옴표 직전도 포함)
  s = s.replace(/습니다(?=[\s.,!?…:;'"”“‘’]|$)/g, "어");
  s = s.replace(/습니까(?=[\s.,!?…:;'"”“‘’]|$)/g, "어?");
  // 남는 ～니다 계열(중간/끝, 따옴표 직전도 포함)
  // (합니다/입니다/됩니다 등은 위에서 먼저 개별 치환하고, 여기서는 잔여만 정리)
  s = s.replace(/니다(?=[\s.,!?…:;'"”“‘’]|$)/g, "어");
  // 흔한 오타/변형: 에요
  s = s.replace(/에요(?=[\s.,!?…:;'"”“‘’]|$)/g, "야");
  // ㅂ 불규칙/형용사: 'ㅂ+어'가 어색한 경우 보정
  s = s.replaceAll("쉽어", "쉬워");
  s = s.replaceAll("어렵어", "어려워");
  s = s.replaceAll("덥어", "더워");
  s = s.replaceAll("춥어", "추워");
  s = s.replaceAll("맵어", "매워");
  // 따옴표 안 예시 존댓말도 반말 톤에 맞춤
  s = s.replaceAll("좋네요", "좋네");
  s = s.replaceAll("싫어요", "싫어");

  s = s.replaceAll("반갑습니다", "반가워");
  s = s.replaceAll("걱정마세요", "걱정 마");
  s = s.replaceAll("걱정 마세요", "걱정 마");
  s = s.replaceAll("계셨", "있었");
  s = s.replaceAll("계셔", "있어");
  s = s.replaceAll("싶으신가?", "싶어?");
  s = s.replaceAll("하고 싶으신가?", "하고 싶어?");
  s = s.replaceAll("커지시고", "커지고");
  s = s.replaceAll("안 좋아지시겠네", "안 좋아지겠네");
  s = s.replaceAll("좋아지시겠네", "좋아지겠네");
  s = s.replaceAll("기쁘시겠지만", "기쁘겠지만");
  s = s.replaceAll("가지시면", "가지면");
  s = s.replaceAll("느껴지시나?", "느껴져?");
  s = s.replaceAll("느껴지시나", "느껴져");
  s = s.replaceAll("느껴지시는", "느껴지는");
  s = s.replaceAll("시달리시죠", "시달리지");
  s = s.replaceAll("들어가신", "들어간");
  s = s.replaceAll("말해주신", "말해준");
  s = s.replaceAll("말해 주신", "말해 준");
  s = s.replaceAll("말해주셔도", "말해줘도");
  s = s.replaceAll("챙겨 드시는", "챙겨 먹는");
  s = s.replaceAll("지적해 주시면", "지적해주면");
  s = s.replaceAll("지적해주시면", "지적해주면");
  s = s.replaceAll("말드리면", "말하면");
  s = s.replaceAll("{nickname}께서는", "{nickname}는");
  s = s.replaceAll("{nickname}께서", "{nickname}가");
  s = s.replaceAll("께서는", "는");
  s = s.replaceAll("께서 ", "가 ");
  s = s.replaceAll("예를 들어요", "예를 들면");
  s = s.replaceAll("불안해지신", "불안해진");
  s = s.replaceAll("느껴지신", "느껴진");

  s = s.replaceAll("계십니다", "있어");
  s = s.replaceAll("어떤 문제가 있으신지", "어떤 문제 있어");
  s = s.replaceAll("문제가 있으신지", "문제 있는지");
  s = s.replaceAll("있으신지", "있는지");
  s = s.replaceAll("답변드리기", "답변하기");
  s = s.replaceAll("답변드리", "답변");
  s = s.replaceAll("설명해 주시겠어", "설명해 줄래");
  s = s.replaceAll("설명해주시겠어", "설명해줄래");
  s = s.replaceAll("자세히 설명해 주시겠어", "자세히 설명해 줄래");
  s = s.replaceAll("주시겠어", "줄래");
  s = s.replaceAll("찾아와주시기 바래", "찾아와줘");
  s = s.replaceAll("찾아와 주시기 바래", "찾아와줘");
  s = s.replaceAll("님께서의", "님의");
  s = s.replaceAll("아시나?", "알아?");
  s = s.replaceAll("쉬어가시죠", "쉬어가자");
  s = s.replaceAll("인정해주셔야", "인정해줘야");
  s = s.replaceAll("케어하실 수 있는", "케어할 수 있는");
  s = s.replaceAll("괴롭혀주신다면", "괴롭혀준다면");
  s = s.replaceAll("좋겠습니다", "좋겠어");
  s = s.replaceAll("존중해 주시면", "존중해주면");
  s = s.replaceAll("응원해 주시고", "응원해주고");
  s = s.replaceAll("기분이 드시는", "기분이 들는");
  s = s.replaceAll("지나가셨으면", "지나갔으면");
  s = s.replaceAll("생각하지 않으시다면", "생각 안 하면");
  s = s.replaceAll("가신 후에", "간 후에");
  s = s.replaceAll("권장줘", "권할게");
  s = s.replaceAll("되세.", "돼.");
  s = s.replaceAll("되세!", "돼!");
  s = s.replaceAll("되세?", "돼?");

  s = s.replaceAll("모르겠습니다만", "모르겠지만");
  s = s.replaceAll("겠습니다만", "겠지만");
  s = s.replaceAll("괜찮지 않으신가?", "안 괜찮아?");
  s = s.replaceAll("많으시겠지만", "많겠지만");
  s = s.replaceAll("싶으시다는", "싶다는");
  s = s.replaceAll("얘기해 드리고", "얘기해주고");
  s = s.replaceAll("드리고 싶은", "해주고 싶은");
  s = s.replaceAll("연락을 주시면", "연락하면");
  s = s.replaceAll("받으시나?", "받아?");
  s = s.replaceAll("받으시나", "받아");
  s = s.replaceAll("불안해지시죠", "불안해지지");
  s = s.replaceAll("해지시죠", "해지지");
  s = s.replaceAll("부모님이는", "부모님은");
  s = s.replaceAll("좋겠어요", "좋겠어");
  s = s.replaceAll("지치고 힘들어지셨군", "지치고 힘들었구나");
  s = s.replaceAll("겪고 계신", "겪고 있는");
  s = s.replaceAll("저희는", "우리는");
  s = s.replaceAll("저희가", "우리가");
  s = s.replaceAll("아니에.", "아니야.");
  s = s.replaceAll("아니에 ", "아니야 ");

  s = s.replaceAll("{nickname}{nickname}", "{nickname}");
  s = s.replaceAll("어렵습니다만", "어렵지만");
  s = s.replaceAll("있으신 거야", "있는 거야");
  s = s.replaceAll("있으신 거", "있는 거");
  s = s.replaceAll("문제가 있으신", "문제 있는");
  s = s.replaceAll("만드시겠지", "만들겠지");
  s = s.replaceAll("만드시죠", "만들지");
  s = s.replaceAll("말드리시면", "말하면");
  s = s.replaceAll("연락주시면", "연락하면");
  s = s.replaceAll("나가시면서", "나가면서");
  s = s.replaceAll("나아가시면서", "나아가면서");
  s = s.replaceAll("해 나가시면서", "해 나가면서");
  s = s.replaceAll("무엇이 자신에게 불편함을 주시나", "뭐가 제일 불편해");
  s = s.replaceAll("불편함을 주시나", "불편해");
  s = s.replaceAll("괴로우시군", "괴롭겠다");
  s = s.replaceAll("해오시다보니", "해오다 보니");
  s = s.replaceAll("해봅시다", "해보자");
  s = s.replaceAll(" 저희 로 ", " 우리한테 ");
  s = s.replaceAll("저희 얘기이", "우리 얘기");
  s = s.replaceAll("필요해면", "필요하면");
  s = s.replaceAll("이해해주셔야", "이해해줘야");
  s = s.replaceAll("해주셔야", "해줘야");
  s = s.replaceAll("보내시게", "보내게");
  s = s.replaceAll("알려드리", "알려줘");
  s = s.replaceAll("보여드리", "보여줘");
  s = s.replaceAll("되시겠", "되겠");
  s = s.replaceAll("식사를 해기", "식사를 하기");
  s = s.replaceAll("중요할게지", "중요하지");

  s = s.replaceAll("겪으신", "겪은");
  s = s.replaceAll("지쳐 있으신", "지쳐 있는");
  s = s.replaceAll("있으신 것 같아", "있는 것 같아");
  s = s.replaceAll("있으신 것 같", "있는 것 같");
  s = s.replaceAll("있으신거야", "있는 거야");
  s = s.replaceAll("있으신데", "있는데");
  s = s.replaceAll("있으신 건", "있는 건");
  s = s.replaceAll("없으신가", "없어");
  s = s.replaceAll("싫으신가", "싫어");
  s = s.replaceAll("왜 싫으신가", "왜 싫어");
  s = s.replaceAll("해보셨나", "해봤나");
  s = s.replaceAll("찾아와주시면", "찾아와주면");
  s = s.replaceAll("드릴 수 있는", "줄 수 있는");
  s = s.replaceAll("추천드리고", "추천하고");
  s = s.replaceAll("이야기하실 수 있는", "이야기할 수 있는");
  s = s.replaceAll("받으신다면", "받는다면");
  s = s.replaceAll("받으신다는", "받는다는");
  s = s.replaceAll("스트레스를 많이 받으신다면", "스트레스 많이 받는다면");
  s = s.replaceAll("무슨 일이 있으신거야", "무슨 일 있는 거야");

  s = s.replaceAll("알려주시면", "알려주면");
  s = s.replaceAll("있지 않으신가", "있지 않아");
  s = s.replaceAll("좋은 것 같으신가", "좋은 것 같아");
  s = s.replaceAll("가지고 계신", "가지고 있는");
  s = s.replaceAll("있으실 것이야", "있을 거야");
  s = s.replaceAll("괴로우시나", "괴로워");
  s = s.replaceAll("존중해주시기를", "존중해주길");
  s = s.replaceAll("들어드리고", "들어주고");
  s = s.replaceAll("들어드리", "들어줘");
  s = s.replaceAll("있으신가봐", "있나 봐");
  s = s.replaceAll("수고 많으셨어", "수고 많았어");
  s = s.replaceAll("호칭해드리면", "호칭하면");
  s = s.replaceAll("마시시나", "마셔");
  s = s.replaceAll("느끼고 계신", "느끼고 있는");
  s = s.replaceAll("찾아주시면", "찾아주면");
  // "얘기해드리" 일괄 치환보다 긴 패턴을 먼저 처리 (예: 얘기해줘릴까? 방지)
  s = s.replaceAll("무엇을 얘기해드릴까", "뭐 얘기해줄까");
  s = s.replaceAll("무엇을 도와드릴까", "뭐 도와줄까");
  s = s.replaceAll("오늘 얘기을 어떻게 도와드릴까", "오늘 얘기를 어떻게 도와줄까");
  s = s.replaceAll("어떻게 도와드릴까", "어떻게 도와줄까");
  s = s.replaceAll("얘기해드릴 수", "얘기해줄 수");
  s = s.replaceAll("얘기해드릴게", "얘기해줄게");
  s = s.replaceAll("얘기해드릴까", "얘기해줄까");
  s = s.replaceAll("도와드릴까", "도와줄까");
  s = s.replaceAll("도와드릴게", "도와줄게");
  s = s.replaceAll("도와드릴 수", "도와줄 수");
  s = s.replaceAll("얘기해드린", "얘기해준");
  s = s.replaceAll("도와드린", "도와준");
  s = s.replaceAll("얘기해드리고", "얘기해주고");
  s = s.replaceAll("얘기해드리", "얘기해줘");
  s = s.replaceAll("들리시면서", "들리면서");
  s = s.replaceAll("받으신다고", "받는다고");
  s = s.replaceAll("부담스러우신", "부담스러운");
  s = s.replaceAll("덜어드리고", "덜어주고");
  s = s.replaceAll("덜어드리", "덜어줘");
  s = s.replaceAll("가지세", "가져");
  s = s.replaceAll("도움을 드리고 싶어", "도움 주고 싶어");
  s = s.replaceAll("도와드리고자", "도와주려고");
  s = s.replaceAll("도와드리기", "도와주기");
  s = s.replaceAll("받으신 이유", "받은 이유");
  s = s.replaceAll("있으셔서", "있어서");
  s = s.replaceAll("저희 는", "우리는");
  s = s.replaceAll("여기 있답니다", "여기 있어");
  s = s.replaceAll("도와드리", "도와줘");
  s = s.replaceAll("부담 가지지 마세", "부담 갖지 마");

  // --- 반말 데이터 잔존 존댓말/격식 추가 정리 ---
  s = s.replaceAll("당신의", `${NICKNAME_PLACEHOLDER}의`);
  s = s.replaceAll("당신은 ", `${NICKNAME_PLACEHOLDER}는 `);
  s = s.replaceAll("당신이 ", `${NICKNAME_PLACEHOLDER}가 `);
  s = s.replaceAll("당신을 ", `${NICKNAME_PLACEHOLDER}를 `);
  s = s.replaceAll("당신과 ", `${NICKNAME_PLACEHOLDER}와 `);
  s = s.replaceAll("귀하의", `${NICKNAME_PLACEHOLDER}의`);
  s = s.replaceAll("먼저, 제 생각에는", "먼저, 내 생각엔");
  s = s.replaceAll("제 생각에는", "내 생각엔");
  s = s.replaceAll("제 생각에", "내 생각에");
  s = s.replaceAll("금일", "오늘");
  s = s.replaceAll("받으셨", "받았");
  s = s.replaceAll("받으시게", "받게");
  s = s.replaceAll("쉬시고", "쉬고");
  s = s.replaceAll("쉬시면", "쉬면");
  s = s.replaceAll("털어놓으셔도", "털어놓아도");
  s = s.replaceAll("되신다는", "된다는");
  s = s.replaceAll("걱정이 되신다는", "걱정된다는");
  s = s.replaceAll("받고 계신", "받고 있는");
  s = s.replaceAll("느끼고 계신", "느끼고 있는");
  s = s.replaceAll("못하실", "못할");
  s = s.replaceAll("느끼지 못하실", "느끼지 못할");
  s = s.replaceAll("생각하십니까", "생각해?");
  s = s.replaceAll("안 좋아지시거나", "안 좋아지거나");
  s = s.replaceAll("많이 하실 가능성", "많이 할 가능성");
  s = s.replaceAll("자신감을 잃으시면", "자신감을 잃으면");
  s = s.replaceAll("커지신다는", "커진다는");
  s = s.replaceAll("말해주실래", "말해줄래");
  s = s.replaceAll("말해 주실래", "말해 줄래");
  s = s.replaceAll("유지하실 생각", "유지할 생각");
  s = s.replaceAll("힘들어지셨나", "힘들어졌나");
  s = s.replaceAll("전 항상 ", "나 항상 ");
  s = s.replaceAll("부담되지 않으시면", "부담스럽지 않으면");
  s = s.replaceAll("치부해면", "치부하면");
  s = s.replaceAll("생각야?", "생각이야?");
  s = s.replaceAll("생각야.", "생각이야.");
  s = s.replaceAll("하는 것이 좋", "하는 게 좋");
  s = s.replaceAll("것이 중요해", "게 중요해");
  s = s.replaceAll("것이 당연한", "게 당연한");
  s = s.replaceAll("무엇을 도와줄까", "뭐 도와줄까");
  s = s.replaceAll("얘기을 받으시게 된", "얘기 받게 된");
  s = s.replaceAll("얘기을 받으시게", "얘기 받게");
  s = s.replaceAll("좋아지시거나", "좋아지거나");
  s = s.replaceAll("힘들어지셨나", "힘들어졌나");
  s = s.replaceAll("현재 당신은 ", `현재 ${NICKNAME_PLACEHOLDER}는 `);
  s = s.replaceAll("지금 상황에서는 당신이 ", `지금 상황에서는 ${NICKNAME_PLACEHOLDER}가 `);

  s = s.replaceAll("귀하는", `${NICKNAME_PLACEHOLDER}는`);
  s = s.replaceAll("귀하처럼", `${NICKNAME_PLACEHOLDER}처럼`);
  s = s.replaceAll("들어드릴", "들어줄");
  s = s.replaceAll("저희 회사", "우리 회사");
  s = s.replaceAll("저희여기", "여기");
  s = s.replaceAll("저희 여기", "여기");
  s = s.replaceAll("저희 얘기을", "우리 얘기를");
  s = s.replaceAll("저희 얘기를", "우리 얘기를");
  s = s.replaceAll("저희 얘기은", "우리 얘기는");
  s = s.replaceAll("저희 얘기가", "우리 얘기가");
  s = s.replaceAll("힘들어하고 계신", "힘들어하고 있는");
  s = s.replaceAll("고민하고 계신", "고민하고 있는");
  s = s.replaceAll("생각하고 계신", "생각하고 있는");
  s = s.replaceAll("지내고 계신", "지내고 있는");
  s = s.replaceAll("하고 계신", "하고 있는");
  s = s.replaceAll("없으셨나", "없었나");
  s = s.replaceAll("있으셨나봐", "있었나 봐");
  s = s.replaceAll("있으셨나", "있었나");
  s = s.replaceAll("궁금하실", "궁금해할");
  s = s.replaceAll("힘드셨겠", "힘들었겠");
  s = s.replaceAll("말하실", "말할");
  s = s.replaceAll("들려주실", "들려줄");
  s = s.replaceAll("받으시는", "받는");
  s = s.replaceAll("나가시는", "나가는");
  s = s.replaceAll("극복해 나가시는", "극복해 나가는");
  s = s.replaceAll("마음이 드시는", "마음이 드는");
  s = s.replaceAll("드시는 거야", "드는 거야");
  s = s.replaceAll("상황이실", "상황일");
  s = s.replaceAll("가지신", "가진");
  s = s.replaceAll("해결해나가시길", "해결해나가길");
  s = s.replaceAll("많으시군", "많구나");
  s = s.replaceAll("하고 계신거야", "하고 있는 거야");
  s = s.replaceAll("못하셨을", "못했을");
  s = s.replaceAll("아프시겠", "아프겠");
  s = s.replaceAll("야근해면서", "야근하면서");
  s = s.replaceAll("흥미를 느끼지 못하실", "흥미를 느끼지 못할");
  s = s.replaceAll("돌아보지 못하고 계신", "돌아보지 못하고 있는");
  s = s.replaceAll("받으시는 것 같은데", "받는 것 같은데");
  s = s.replaceAll("스트레스를 많이 받으시는", "스트레스를 많이 받는");
  s = s.replaceAll("갈등이 생기신", "갈등이 생긴");
  s = s.replaceAll("대화를 많이 나누지 않으셨을", "대화를 많이 나누지 않았을");
  s = s.replaceAll("여기 계신거죠", "여기 온 거지");
  s = s.replaceAll("머리가 아프시겠지만", "머리 아프겠지만");
  s = s.replaceAll("꿈을 많이 꾸시고", "꿈을 많이 꾸고");
  s = s.replaceAll("가지신 취미", "가진 취미");

  s = s.replaceAll("귀하가", `${NICKNAME_PLACEHOLDER}가`);
  s = s.replaceAll("귀하를", `${NICKNAME_PLACEHOLDER}를`);
  s = s.replaceAll("귀하께", `${NICKNAME_PLACEHOLDER}에게`);
  s = s.replaceAll("안고 계신", "안고 있는");
  s = s.replaceAll("느낌도 드시는", "느낌도 드는");
  s = s.replaceAll("고민이 되실", "고민될");
  s = s.replaceAll("부담되지 않으시겠지", "부담스럽지 않지");
  s = s.replaceAll("말해주실 수 있을까", "말해줄 수 있을까");
  s = s.replaceAll("말해 주실 수 있을까", "말해 줄 수 있을까");
  s = s.replaceAll("말해주실 수 있으", "말해줄 수 있어");
  s = s.replaceAll("이야기해주실 수 있을까", "이야기해줄 수 있을까");
  s = s.replaceAll("알려주실 수 있나", "알려줄 수 있어");
  s = s.replaceAll("들어주실 수", "들어줄 수");
  s = s.replaceAll("힘들어지고 지치셨나", "힘들어지고 지쳤나");
  s = s.replaceAll("받아봐게 되셨군", "받아보게 됐구나");
  s = s.replaceAll("오직 당신만의", `오직 ${NICKNAME_PLACEHOLDER}만의`);
  s = s.replaceAll("얘기해주실래", "얘기해줄래");
  s = s.replaceAll("말드리는", "말하는");
  s = s.replaceAll("답답하게 느껴지시군", "답답하게 느껴지는구나");
  s = s.replaceAll("생각해면서", "생각하면서");
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}님이야`, `${BOT_NAME_PLACEHOLDER}야`);
  s = s.replaceAll(`${BOT_NAME_PLACEHOLDER}님은`, `${BOT_NAME_PLACEHOLDER}는`);
  s = s.replaceAll("마음에 안 드시는", "마음에 안 드는");
  s = s.replaceAll("고통받으시면", "고통받으면");
  s = s.replaceAll("느끼시는 것 같아", "느끼는 것 같아");

  s = s.replaceAll("저희 가족", `${NICKNAME_PLACEHOLDER}의 가족`);
  s = s.replaceAll("싸우셨다니", "싸웠다니");
  s = s.replaceAll("물론이에.", "물론이지.");
  s = s.replaceAll("물론이에 ", "물론이지 ");
  s = s.replaceAll("문제가 생기셨나", "문제가 생겼나");
  s = s.replaceAll("말을 나누셨다는", "말을 나눴다는");
  s = s.replaceAll("되셨을까", "됐을까");
  s = s.replaceAll("되셨군", "됐네");
  s = s.replaceAll("괴로워지셨군", "괴로워졌구나");
  s = s.replaceAll("힘들어지셨군", "힘들어졌구나");
  s = s.replaceAll("지셨군", "졌구나");
  s = s.replaceAll("알려주실", "알려줄");
  s = s.replaceAll("이야기해주실", "이야기해줄");
  s = s.replaceAll("지금 드리는 말이 불편하실 수도 있지만", "지금 하는 말이 불편할 수도 있지만");
  s = s.replaceAll("쉽지 않으시군", "쉽지 않겠다");
  s = s.replaceAll("생각이 드시는군", "생각이 드는구나");
  s = s.replaceAll("말하세.", "말해.");
  s = s.replaceAll("말하세!", "말해!");
  s = s.replaceAll("말하세?", "말해?");
  s = s.replaceAll("대처해면", "대처하면");
  s = s.replaceAll("생각해면", "생각하면");
  s = s.replaceAll("시작해면", "시작하면");
  s = s.replaceAll("도움을 드릴", "도움 줄");
  s = s.replaceAll("맞추세", "맞춰");
  s = s.replaceAll("보내세", "보내");
  s = s.replaceAll("뵙겠어", "보자");
  s = s.replaceAll("힘들어지실", "힘들어질");
  s = s.replaceAll("저와 함께", "나랑 함께");
  s = s.replaceAll("저희들이", "우리가");

  // 남는 honorific infix / 깨진 결합 추가 정리
  s = s.replaceAll("겪으시다니", "겪다니");
  s = s.replaceAll("겪으시는", "겪는");
  s = s.replaceAll("겪으시면", "겪으면");
  s = s.replaceAll("겪으시", "겪");
  s = s.replaceAll("묘사해주실", "묘사해줄");
  s = s.replaceAll("말해주실", "말해줄");
  s = s.replaceAll("해주실", "해줄");
  s = s.replaceAll("주실 수", "줄 수");
  s = s.replaceAll("주실래", "줄래");
  s = s.replaceAll("당연한 일이에.", "당연한 일이지.");
  s = s.replaceAll("당연한 일이에 ", "당연한 일이지 ");
  s = s.replaceAll("있는다는", "있다는");
  s = s.replaceAll("겪고 있는다는", "겪고 있다는");
  s = s.replaceAll("질문을 드려도", "질문해도");
  s = s.replaceAll("분의 고민", `${NICKNAME_PLACEHOLDER}의 고민`);
  s = s.replaceAll("분이 고민", `${NICKNAME_PLACEHOLDER}가 고민`);
  s = s.replaceAll("해 봐는", "해 보는");
  s = s.replaceAll("봐는 것", "보는 것");
  s = s.replaceAll("해면 돼", "하면 돼");
  s = s.replaceAll("해면 좋", "하면 좋");
  s = s.replaceAll("해면서", "하면서");
  s = s.replaceAll("일해고", "일하고");
  s = s.replaceAll("생기시는", "생기는");
  s = s.replaceAll("드시는군", "드는구나");
  s = s.replaceAll("기분이 드시기", "기분이 들 때");
  s = s.replaceAll("찾아주셨", "찾아줬");
  s = s.replaceAll("들어주실", "들어줄");
  s = s.replaceAll("말해 주실", "말해 줄");
  s = s.replaceAll("고 싶으시다면", "고 싶으면");
  s = s.replaceAll("되어드리고", "해주고");
  s = s.replaceAll("되어드리", "해줘");
  s = s.replaceAll("하세.", "해.");
  s = s.replaceAll("하세 ", "해 ");
  s = s.replaceAll("추측해봅니다", "추측해봐");
  s = s.replaceAll("생기시면", "생기면");
  s = s.replaceAll("가시게", "가게");
  s = s.replaceAll("오시기", "오기");
  s = s.replaceAll("느끼셨다고", "느꼈다고");
  s = s.replaceAll("느껴지시겠지", "느껴지겠지");
  s = s.replaceAll(" 드시겠지", " 느껴지겠지");
  s = s.replaceAll("기분이 드시는", "기분이 들는");
  s = s.replaceAll("감정이 드시는", "감정이 느껴지는");
  s = s.replaceAll("이 드시는", "이 느껴지는");
  s = s.replaceAll("보이고 계신", "보이고 있는");
  s = s.replaceAll(" 걱정해게 ", " 걱정하게 ");
  s = s.replaceAll("말을 걸지 못해겠다", "말을 걸지 못하겠다");
  s = s.replaceAll("이 님에게", `이 ${NICKNAME_PLACEHOLDER}에게`);
  s = s.replaceAll(" 등이 님에게", ` 등이 ${NICKNAME_PLACEHOLDER}에게`);
  s = s.replaceAll("드시는 음료", "마실 거");
  s = s.replaceAll("모르시는", "모르는");
  s = s.replaceAll("추천드리는", "추천하는");
  s = s.replaceAll("괴로우신가", "괴로운 거야");
  s = s.replaceAll("있으셔도", "있어도");
  s = s.replaceAll("느끼셨겠군", "느꼈겠다");
  s = s.replaceAll("느끼셨어", "느꼈어");
  s = s.replaceAll("느끼셨", "느꼈");
  s = s.replaceAll("쉬운 일이 아닙니다", "쉬운 일이 아니야");
  s = s.replaceAll("어려운 일이 아닙니다", "어려운 일이 아니야");

  s = finalizeCasualBanmal(s);
  return s;
}

/**
 * 직함/직위 호칭의 ~님 제거 시 조사가 깨지지 않게 처리 (상사님은 → 상사는, 팀장님은 → 팀장은).
 */
function stripHonorificTitleParticles(t, honorific, base, particles) {
  const { topic, subj, obj, withPart, withPoss } = particles;
  let out = t;
  const pairs = [
    [`${honorific}과의`, `${base}${withPoss}`],
    [`${honorific}과`, `${base}${withPart}`],
    [`${honorific}와의`, `${base}${withPoss}`],
    [`${honorific}와`, `${base}${withPart === "과" ? "과" : "와"}`],
    [`${honorific}은`, `${base}${topic}`],
    [`${honorific}는`, `${base}${topic}`],
    [`${honorific}이`, `${base}${subj}`],
    [`${honorific}가`, `${base}${subj}`],
    [`${honorific}을`, `${base}${obj}`],
    [`${honorific}를`, `${base}${obj}`],
    [`${honorific}도`, `${base}도`],
    [`${honorific}만`, `${base}만`],
    [`${honorific}께`, `${base}한테`],
    [`${honorific}에게`, `${base}한테`],
    [`${honorific}한테`, `${base}한테`],
    [`${honorific}께서는`, `${base}는`],
    [`${honorific}께서`, `${base}가`],
  ];
  for (const [a, b] of pairs) out = out.replaceAll(a, b);
  out = out.replaceAll(honorific, base);
  return out;
}

function stripWorkplaceTitlesForCasual(t) {
  let out = t;
  const titles = [
    ["상사님", "상사", { topic: "는", subj: "가", obj: "를", withPart: "와", withPoss: "와의" }],
    ["팀장님", "팀장", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
    ["교수님", "교수", { topic: "는", subj: "가", obj: "를", withPart: "와", withPoss: "와의" }],
    ["선생님", "선생", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
    ["사장님", "사장", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
    ["부장님", "부장", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
    ["과장님", "과장", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
    ["대리님", "대리", { topic: "는", subj: "가", obj: "를", withPart: "와", withPoss: "와의" }],
    ["원장님", "원장", { topic: "은", subj: "이", obj: "을", withPart: "과", withPoss: "과의" }],
  ];
  for (const [h, b, p] of titles) out = stripHonorificTitleParticles(out, h, b, p);
  return out;
}

/** 청자 높임(~군), 보겠어, 격식체 잔재 제거 — 어시스턴트 반말 톤을 일관되게 */
function finalizeCasualBanmal(s) {
  let t = s;
  t = stripWorkplaceTitlesForCasual(t);
  t = t.replaceAll("귀 기울여 듣겠어", "귀 기울여 줄게");
  t = t.replaceAll("들어보겠어?", "들어볼래?");
  t = t.replaceAll("들어보겠어", "들어볼래");
  t = t.replaceAll("나누어 보겠어.", "나누어 볼게.");
  t = t.replaceAll("나누어 보겠어", "나누어 볼게");
  t = t.replaceAll("살펴보겠어?", "살펴볼래?");
  t = t.replaceAll("살펴보겠어", "살펴볼게");
  t = t.replaceAll("파악해보겠어", "파악해 볼게");
  t = t.replaceAll("보겠어?", "볼래?");
  t = t.replaceAll("보겠어", "볼래");
  t = t.replaceAll("듣겠어.", "들을게.");
  t = t.replaceAll("듣겠어?", "들을래?");
  t = t.replaceAll("듣겠어", "들을게");
  t = t.replaceAll("말하겠어", "말할게");
  t = t.replaceAll("얘기하겠어", "얘기할게");
  t = t.replaceAll("그러시면", "그러면");
  t = t.replaceAll("그렇지요", "그치");
  t = t.replaceAll("그렇죠", "그치");
  t = t.replaceAll("이러한", "이런");
  t = t.replaceAll("저러한", "저런");
  t = t.replaceAll("우선적으로", "우선");
  t = t.replaceAll("상사분", "상사");
  t = t.replaceAll("하는 것은 ", "하는 건 ");
  t = t.replaceAll("있는 것은 ", "있는 건 ");
  t = t.replaceAll("하는 것이 ", "하는 게 ");
  t = t.replaceAll("있는 것이 ", "있는 게 ");
  t = t.replaceAll("안되며", "안 되고");
  t = t.replaceAll("이기도 하죠", "이기도 해");
  t = t.replaceAll(" 하죠.", " 하지.");
  t = t.replaceAll(" 하죠?", " 하지?");
  t = t.replaceAll(" 하죠!", " 하지!");
  t = t.replaceAll(" 다죠.", " 다지.");
  t = t.replaceAll("그렇군", "그렇네");
  t = t.replaceAll("그래군", "그렇네");
  t = t.replaceAll("힘들겠군", "힘들겠네");
  t = t.replaceAll("막막해군", "막막하겠네");
  t = t.replaceAll("어렵겠군", "어렵겠네");
  t = t.replaceAll("했군", "했네");
  t = t.replaceAll("였군", "였네");
  t = t.replaceAll("였다고 했군", "였다고 했네");
  t = t.replaceAll("다고 했군", "다고 했네");
  t = t.replaceAll("느낀다고 했군", "느낀다고 했네");
  t = t.replaceAll("거군.", "거네.");
  t = t.replaceAll("거군?", "거네?");
  t = t.replaceAll("거군!", "거네!");
  t = t.replaceAll("는군.", "는네.");
  t = t.replaceAll("는군?", "는네?");
  t = t.replaceAll("잖아요", "잖아");
  t = t.replaceAll("잖습니까", "잖아");

  // naive 님→제거 후 남는 조사/접속 오류 복구
  t = t
    .replaceAll("상사은", "상사는")
    .replaceAll("상사이 ", "상사가 ")
    .replaceAll("상사을", "상사를")
    .replaceAll("상사과", "상사와");
  t = t.replaceAll("토로하는네", "토로하네").replaceAll("생각하는네", "생각하네");

  // 청자 높임 ~군 → ~네. 직군/한국군 등은 (?<!직)(?<!국)으로 제외.
  t = t.replace(/(?<![직국])([가-힣]+)군(?=[.?!,]|\s|$)/g, "$1네");

  t = t
    .replaceAll("괴로워지셨네", "괴로워졌구나")
    .replaceAll("힘들어지셨네", "힘들어졌구나");

  // 스캔으로 남는 ~시~/으시~, 드리~, 저희, ㅂ니다 잔재
  t = t
    .replaceAll("얘기해 드릴까", "얘기해줄까")
    .replaceAll("뭐를 얘기해 드릴까", "뭐 얘기해줄까")
    .replaceAll("받으시면", "받으면")
    .replaceAll("얻으실 수", "얻을 수")
    .replaceAll("계실 것", "있을 것")
    .replaceAll("찾으시려고", "찾으려고")
    .replaceAll("갖추시면", "갖추면")
    .replaceAll("알아보실 수", "알아볼 수")
    .replaceAll("들어드린", "들어준")
    .replaceAll("떨쳐 놓으시고", "떨쳐 놓고")
    .replaceAll("이루시길", "이루길")
    .replaceAll("추천드리며", "추천하면서")
    .replaceAll("깊으시네", "깊네")
    .replaceAll("살아가시길", "살아가길")
    .replaceAll("나가시면", "나가면")
    .replaceAll("쉽지 않으시겠어", "쉽지 않겠어")
    .replaceAll("알아내시면", "알아내면")
    .replaceAll("찾아오세", "찾아와")
    .replaceAll("많으시겠어", "많겠어")
    .replaceAll("무거우시겠지만", "무거울 텐데")
    .replaceAll("많아지시면서", "많아지면서")
    .replaceAll("해 나가시면", "해 나가면")
    .replaceAll("이야기하고 싶으시면", "이야기하고 싶으면")
    .replaceAll("찾아오시면", "찾아오면")
    .replaceAll("받으시기", "받기")
    .replaceAll("막막하실", "막막할")
    .replaceAll("힘내시길", "힘내길")
    .replaceAll("바라시는", "바라는")
    .replaceAll("대처하시면", "대처하면")
    .replaceAll("만드시면", "만들면")
    .replaceAll("충분하지 않으시네", "충분하진 않네")
    .replaceAll("들어주지 않으시다니", "들어주지 않다니")
    .replaceAll("괜찮은 얘기을 받으시기", "괜찮은 얘기 받기")
    .replaceAll("입으실 수도", "입을 수도")
    .replaceAll("내버려 두시면", "내버려 두면")
    .replaceAll("업무량이 많아지시면서", "업무량이 많아지면서");

  t = t
    .replaceAll("저희와", "우리랑")
    .replaceAll("저희에게", "우리한테")
    .replaceAll("저희의", "우리의")
    .replaceAll("저희가", "우리가")
    .replaceAll("저희는", "우리는")
    .replaceAll("저희 ", "우리 ");

  t = t
    .replaceAll("찾으시면", "찾으면")
    .replaceAll("가시면", "가면")
    .replaceAll("많으시네", "많네")
    .replaceAll("받으시려고", "받으려고")
    .replaceAll("들으시면서", "들으면서")
    .replaceAll("하실 때", "할 때")
    .replaceAll("쌓으시면", "쌓으면")
    .replaceAll("누리실 수", "누릴 수")
    .replaceAll("세우시는", "세우는")
    .replaceAll("연락해 오시면", "연락해 오면")
    .replaceAll("강해지시길", "강해지길")
    .replaceAll("힘을 내실 수", "힘 낼 수")
    .replaceAll("되셨기를", "됐기를")
    .replaceAll("일도 손에 잡히지 않으시고", "일도 손에 잡히지 않고")
    .replaceAll("싶지 않으시다니", "싫다니")
    .replaceAll("나가고 싶지 않으시다니", "나가기 싫다니")
    .replaceAll("좋은 시간 보내시길", "좋은 시간 보내길")
    .replaceAll("얘기 받으시려고", "얘기 받으려고")
    .replaceAll("덜어내시는", "덜어내는")
    .replaceAll("축하드려", "축하해")
    .replaceAll("좋은 방법이에.", "좋은 방법이야.")
    .replaceAll("좋은 방법이에 ", "좋은 방법이야 ");

  t = t.replace(/다릅니다(?=[\s.]|$)/g, "달라");

  // 봇·유저는 가족 아님: 어시스턴트 문장의 '우리 가족/우리 부모님' 등 정리
  t = t
    .replaceAll("우리 가족관계", "가족관계")
    .replaceAll("우리 가족 구성원", "가족 구성원")
    .replaceAll("우리 가족", `${NICKNAME_PLACEHOLDER}의 가족`);
  t = t
    .replaceAll("우리 부모님", `${NICKNAME_PLACEHOLDER}네 부모님`)
    .replaceAll("우리 아버지", `${NICKNAME_PLACEHOLDER} 아버지`)
    .replaceAll("우리 어머니", `${NICKNAME_PLACEHOLDER} 어머니`)
    .replaceAll("우리 아빠", `${NICKNAME_PLACEHOLDER} 아빠`)
    .replaceAll("우리 엄마", `${NICKNAME_PLACEHOLDER} 엄마`)
    .replaceAll("우리 아버지와의", `${NICKNAME_PLACEHOLDER} 아버지와의`)
    .replaceAll("우리 아버지와", `${NICKNAME_PLACEHOLDER} 아버지와`);

  t = t
    .replaceAll("우리 인생에서", `${NICKNAME_PLACEHOLDER} 인생에서`)
    .replaceAll("우리 인생의", `${NICKNAME_PLACEHOLDER} 인생의`);

  t = t.replaceAll("우리 얘기에서는", "지금 얘기에서는");

  // 자주 나오는 어색한 결합/오타
  t = t
    .replaceAll("함께 고민해보아.", "함께 고민해보자.")
    .replaceAll("함께 고민해보아 ", "함께 고민해보자 ")
    .replaceAll("함께 고민해보아", "함께 고민해보자")
    .replaceAll("돼는네", "되는 거네")
    .replaceAll("보이야", "보여")
    .replaceAll("가족이서 ", "가족이 ")
    .replaceAll("축하줘", "축하해")
    .replaceAll("기분 나쁘시겠지만", "기분 나쁠 수 있겠지만")
    .replaceAll("우울해다는", "우울하다는")
    .replaceAll("심해다는", "심하다는");

  t = t
    .replaceAll("걱정이 돼는", "걱정되는")
    .replaceAll("저해키고", "저해하고")
    .replaceAll("막막할게네", "막막하겠네")
    .replaceAll("피곤해다고", "피곤하다고")
    .replaceAll("자아내기 마련", "생기기 쉽지")
    .replaceAll("자아내기", "일으키기")
    .replaceAll("추천줘", "추천할게")
    .replaceAll("말해니", "말하니")
    .replaceAll("비교해게", "비교하게")
    .replaceAll("평가해니", "평가하니")
    .replaceAll("이런 저의 말", "이런 말")
    .replaceAll("전문의 얘기과", "전문가한테 얘기")
    .replaceAll("이번 얘기이", "이번 얘기가")
    .replaceAll("얘기을 받으세", "얘기하러 와")
    .replaceAll("얘기를 받으세", "얘기하러 와")
    .replaceAll("함께 얘기해보자해볼까", "얘기해볼까")
    .replaceAll("얘기해보자해볼까", "얘기해볼까")
    .replaceAll("해보도록 할까", "해볼까")
    .replaceAll("해해면", "하면")
    .replaceAll("원해면", "원하면")
    .replaceAll("요청해면", "요청하면")
    .replaceAll("배워해면", "배우면")
    .replaceAll("그래다니", "그렇다니")
    .replaceAll("저와 같은 전문", "나 같은")
    .replaceAll(" 님과 ", ` ${NICKNAME_PLACEHOLDER}랑 `)
    .replaceAll("언제든지 님을", `언제든지 ${NICKNAME_PLACEHOLDER}를`)
    .replaceAll("네, 님과", `네, ${NICKNAME_PLACEHOLDER}랑`);

  t = t.replaceAll(`이상이야. ${NICKNAME_PLACEHOLDER}`, `여기까지야. ${NICKNAME_PLACEHOLDER}`);

  t = t.replaceAll("어머님이는", "어머님은").replaceAll("아버님이는", "아버님은");

  t = polishCasualAssistantKorean(t);
  return t;
}

/**
 * 존대→반말 치환 부작용(해고/해기), 격식·오타 잔재를 한 번 더 다듬음.
 */
function polishCasualAssistantKorean(s) {
  let t = s;

  t = t
    .replaceAll(`많은 ${NICKNAME_PLACEHOLDER} 가지는`, "많은 사람들이 가지는")
    .replaceAll(`느끼는 ${NICKNAME_PLACEHOLDER} 많아`, "그렇게 느끼는 사람 많아")
    .replaceAll(`적응에 어려움을 느끼는 ${NICKNAME_PLACEHOLDER} 많아`, "적응하느라 힘든 사람 많아")
    .replaceAll(`다른 ${NICKNAME_PLACEHOLDER} 도움`, "다른 사람 도움")
    .replaceAll(`다른 ${NICKNAME_PLACEHOLDER}들`, "다른 사람들")
    .replaceAll(`많은 ${NICKNAME_PLACEHOLDER} 경험`, "많은 사람들이 경험");

  t = t
    .replaceAll("기분 드는", "기분이 들는")
    .replaceAll("상대방의 반응에 민감하게 반응했네", "상대 반응에 너무 예민하게 반응했네")
    .replaceAll("형성하실 수", "만들 수")
    .replaceAll("저와 얘기를", "나랑 얘기")
    .replaceAll("아무것도 아니어.", "별말 아니야.")
    .replaceAll("아무것도 아니어", "별말 아니야");

  t = t
    .replaceAll("돼는 ", "되는 ")
    .replaceAll("돼는.", "되는.")
    .replaceAll("돼는?", "되는?")
    .replaceAll("걱정돼는", "걱정되는")
    .replaceAll("고민돼는", "고민되는")
    .replaceAll("저해키기", "저해하기")
    .replaceAll("저해키고", "저해하고")
    .replaceAll("님만의", `${NICKNAME_PLACEHOLDER}만의`)
    .replaceAll("도움이 되셨다니", "도움이 됐다니")
    .replaceAll("오늘 얘기하실 내용이", "오늘 할 말이")
    .replaceAll("오늘 얘기하실 내용", "오늘 할 말")
    .replaceAll("제시해드렸는데", "제시해줬는데")
    .replaceAll("제시해 드렸는데", "제시해줬는데")
    .replaceAll("처리해주시는", "처리해주는")
    .replaceAll("부담스러우시다는", "부담스럽다는")
    .replaceAll("해고 도와", "하고 도와")
    .replaceAll("느낌이 드시네", "느낌 드네")
    .replaceAll("듯신 거야", "듯한 거야")
    .replaceAll("배우실 수", "배울 수")
    .replaceAll("쌓이실거라고", "쌓일 거라고")
    .replaceAll("있을 답니다", "있대")
    .replaceAll("예방할 수 있답니다", "예방할 수 있어");

  t = t.replaceAll(`다른 ${NICKNAME_PLACEHOLDER} 내가`, "다른 사람들이 내가");

  t = t
    .replaceAll(" 생각해봅니다", " 생각해봐")
    .replaceAll("생각해봅니다.", "생각해봐.")
    .replaceAll("알 수 있을 거예", "알 수 있을 거야")
    .replaceAll("궁금해할 거예", "궁금해하겠지")
    .replaceAll("불안해겠지", "불안하겠지")
    .replaceAll("드시다니", "드니")
    .replaceAll("님을 무시", `${NICKNAME_PLACEHOLDER}를 무시`)
    .replaceAll("원해나?", "원해?")
    .replaceAll("원해나 ", "원해 ")
    .replaceAll("부탁줄", "부탁할")
    .replaceAll("열심히 말줄게", "열심히 말해줄게")
    .replaceAll(" 겁니다.", " 거야.")
    .replaceAll("큰 충격을 주었을 겁니다", "큰 충격을 줬을 거야")
    .replaceAll("많습니다만", "많지만")
    .replaceAll("말줄게", "말해줄게");

  t = t
    .replaceAll("이곳은 여기이야", "여기야")
    .replaceAll("안녕!,", "안녕!")
    .replaceAll("안녕! ,", "안녕! ");

  t = t
    .replaceAll("얘기을 ", "얘기를 ")
    .replaceAll("얘기을.", "얘기를.")
    .replaceAll("얘기을,", "얘기를,")
    .replaceAll("대화을 ", "대화를 ")
    .replaceAll("여기을 ", "여기를 ")
    .replaceAll("나누어 ", "나눠 ")
    .replaceAll("나누어.", "나눠.")
    .replaceAll("맞추어 ", "맞춰 ")
    .replaceAll("맞추어.", "맞춰.");

  t = t.replaceAll("하지 마시고", "하지 말고").replaceAll("말지 마시고", "말지 말고");

  t = t.replaceAll("기분 들어?", "기분이 들어?").replaceAll("기분 들어.", "기분이 들어.");

  t = t
    .replaceAll("것야?", "거야?")
    .replaceAll("것야.", "거야.")
    .replaceAll("것야!", "거야!")
    .replaceAll("것야 ", "거야 ");

  t = t.replaceAll("중 하나이야", "중 하나야").replaceAll("문제중 하나", "문제 중 하나");

  t = t.replaceAll("생깁니다", "생겨");

  t = t.replaceAll("우리가 함께 생각", "같이 생각").replaceAll("우리가 함께 이", "같이 이");

  t = t.replaceAll("귀찮으신가", "귀찮아?").replaceAll("귀찮으신가?", "귀찮아?");

  // 하시→해 과정에서 생긴 연결형 '…해고' → '…하고'
  t = t.replace(/([가-힣]{2,})해고(?=[\s.,!?…:;]|$)/g, "$1하고");

  t = t
    .replaceAll("싶어해기 때문이야", "싶어 해서 그래")
    .replaceAll("싶어해기 때문", "싶어 해서")
    .replaceAll("싶어해기도", "싶어 하기도")
    .replaceAll("싶어해기 ", "싶어 하기 ")
    .replaceAll("싶어해기", "싶어 해서");

  // 남는 '…해기' → '…하기'(명사형)
  t = t.replace(/([가-힣]{2,})해기(?=[\s.,!?…:;를을이가는도과]|$)/g, "$1하기");

  t = t.replaceAll("여기이야", "여기야").replaceAll("이곳은 여기야", "여기야");

  t = t
    .replaceAll("알고 싶어 해서 해서", "알고 싶어 해서")
    .replaceAll("이해하기 바래", "이해했으면 좋겠어")
    .replaceAll("일하기 바래", "일했으면 좋겠어");

  t = t.replaceAll("도움 되셨다니", "도움이 됐다니").replaceAll("편해지셨다니", "편해졌다니");

  t = t.replaceAll("겪고 있는 모습이 보이야", "겪고 있는 것 같아 보여");

  // 청유·문어체 종결: 합시다/봅시다, ~것이야→~거야, 조건 높임(많으시다면) 등
  t = t.replaceAll("봅시다", "보자");
  t = t.replaceAll("합시다", "하자");
  t = t.replaceAll("것이야", "거야");
  t = t
    .replaceAll("많으시다면", "많다면")
    .replaceAll("많으시면", "많으면")
    .replaceAll("어려우시겠지만", "어렵겠지만")
    .replaceAll("느끼실 수 있어", "느낄 수 있어")
    .replaceAll("느끼실 때", "느낄 때")
    .replaceAll("힘들어지시면", "힘들어지면")
    .replaceAll("불만족하신", "불만족한")
    .replaceAll("찾으셨나", "찾았")
    .replaceAll("해결해드릴까", "해결해줄까")
    .replaceAll("해결해 드릴까", "해결해줄까");

  t = t
    .replaceAll("이번에 드신 ", "이번에 겪은 ")
    .replaceAll("드신다고", "든다고")
    .replaceAll("드신다면", "든다면")
    .replaceAll("드신 거", "든 거")
    .replaceAll("마음이 드신다면", "마음이 든다면")
    .replaceAll("해소하실", "해소할")
    .replaceAll("조언해드릴", "조언해줄")
    .replaceAll("조언해 드릴", "조언해줄")
    .replaceAll("이야기해드릴", "이야기해줄")
    .replaceAll("이야기해 드릴", "이야기해줄")
    .replaceAll("설명드릴까", "설명해줄까")
    .replaceAll("설명 드릴까", "설명해줄까")
    .replaceAll("맞이해드릴", "맞이해줄")
    .replaceAll("제안해드릴", "제안해줄")
    .replaceAll("제안해 드릴", "제안해줄")
    .replaceAll("제시해드릴", "제시해줄")
    .replaceAll("제시해 드릴", "제시해줄")
    .replaceAll("제시해드리고", "제시해주고")
    .replaceAll("제시해드리며", "제시해주며")
    .replaceAll("답해드릴", "답해줄")
    .replaceAll("해드릴 수 있도록", "해줄 수 있게")
    .replaceAll("당황스러우셨을", "당황스러웠을")
    .replaceAll("걱정스러우실", "걱정스러울")
    .replaceAll("이겨내신", "이겨낸")
    .replaceAll("괜찮아지시도록", "괜찮아지게")
    .replaceAll("지내셨", "지냈")
    .replaceAll("누구신지", "누군지")
    .replaceAll("태어나신 ", "태어난 ")
    .replaceAll("해보신 ", "해본 ")
    .replaceAll("세웁니다", "세워")
    .replaceAll("중요하답니다", "중요해")
    .replaceAll("였답니다", "였대")
    .replaceAll("떠드시면서", "떠들면서")
    .replaceAll("불안해지시다는", "불안해진다는")
    .replaceAll("크시다는", "크다는")
    .replaceAll("느끼십니다", "느껴")
    .replaceAll("아닙니다", "아니야")
    .replaceAll("지금 드리는 말", "지금 하는 말")
    .replaceAll("유지시켜 줍니다", "유지시켜 줘")
    .replaceAll("그만두시는", "그만두는")
    .replaceAll("성과를 내신", "성과를 낸")
    .replaceAll("있으신 만큼", "있는 만큼")
    .replaceAll("인정하셔야", "인정해야")
    .replaceAll("귀하도", "너도")
    .replaceAll("느끼실 수 있으실", "느낄 수 있을")
    .replaceAll("줍니다", "줘")
    .replaceAll("생각나시나", "생각나")
    .replaceAll("결정하실 수", "결정할 수")
    .replaceAll("나누실 ", "나눌 ")
    .replaceAll("말드렸", "말했")
    .replaceAll("들으셨", "들었")
    .replaceAll("불만족스러우셨", "불만족스러웠")
    .replaceAll("이해해주시겠지", "이해해주겠지")
    .replaceAll("저와 자세히", "나랑 자세히");

  t = t
    .replaceAll("대단하십니다", "대단해")
    .replaceAll("하십니다.", "해.")
    .replaceAll("하십니다 ", "해 ")
    .replaceAll("하십니다", "해")
    .replaceAll("아파집니다", "아파져")
    .replaceAll("말드릴", "말할");

  t = t.replaceAll(" 거에.", " 거야.").replaceAll(" 거에 ", " 거야 ");

  return t;
}

function convertTurns(turns) {
  const ftMessagesPolite = [];
  const ftMessagesCasual = [];

  for (const t of turns) {
    const speaker = t?.speaker;
    const utterance = cleanText(t?.utterance);
    if (!utterance) continue;

    const senderType = normalizeSender(speaker);
    const role = normalizeRole(speaker);
    if (!senderType || !role) continue;

    if (role === "assistant") {
      const polite = rewritePoliteFriend(utterance);
      const casual = rewriteCasualFriend(utterance);
      const casualBanmal = forceCasualOnly(forceCasualOnly(casual));

      ftMessagesPolite.push({ role, content: forcePoliteOnly(polite) });
      ftMessagesCasual.push({ role, content: casualBanmal });
    } else {
      const userPolite = rewriteUserUtterance(utterance);
      const userCasual = rewriteUserUtteranceCasual(utterance);

      ftMessagesPolite.push({ role, content: userPolite });
      ftMessagesCasual.push({ role, content: userCasual });
    }
  }

  return { ftMessagesPolite, ftMessagesCasual };
}

async function main() {
  const rl = readline.createInterface({
    input: fs.createReadStream(src, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  const ftPoliteStream = fs.createWriteStream(outFtPolite, { encoding: "utf-8" });
  const ftCasualStream = fs.createWriteStream(outFtCasual, { encoding: "utf-8" });

  let totalIn = 0;
  let totalOut = 0;

  for await (const rawLine of rl) {
    totalIn += 1;
    const line = rawLine.trim();
    if (!line) continue;

    let turns;
    try {
      turns = JSON.parse(line);
    } catch {
      continue;
    }
    if (!Array.isArray(turns)) continue;

    const { ftMessagesPolite, ftMessagesCasual } = convertTurns(turns);
    if (ftMessagesPolite.length < 2) continue;

    // Finetune dataset: separate files per tone (system prompt differs)
    ftPoliteStream.write(
      JSON.stringify(
        {
          messages: [{ role: "system", content: SYSTEM_PROMPT_POLITE }, ...ftMessagesPolite],
          metadata: {
            domain: "counsel",
            source: "total_kor_multiturn_counsel_bot",
            language: "ko",
            tone: "polite_friend",
          },
        },
        null,
        0
      ) + "\n"
    );
    ftCasualStream.write(
      JSON.stringify(
        {
          messages: [{ role: "system", content: SYSTEM_PROMPT_CASUAL }, ...ftMessagesCasual],
          metadata: {
            domain: "counsel",
            source: "total_kor_multiturn_counsel_bot",
            language: "ko",
            tone: "casual_friend",
          },
        },
        null,
        0
      ) + "\n"
    );

    totalOut += 1;
  }

  await new Promise((r) => ftPoliteStream.end(r));
  await new Promise((r) => ftCasualStream.end(r));

  console.log(`Converted ${totalOut} conversations (from ${totalIn} lines).`);
  console.log(`- data/${path.basename(outFtPolite)} (높임말 finetune)`);
  console.log(`- data/${path.basename(outFtCasual)} (반말 finetune)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

