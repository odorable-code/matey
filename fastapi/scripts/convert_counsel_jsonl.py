import json
import pathlib
from typing import Any, Dict, List, Literal, Optional, Tuple

Speaker = Literal["상담사", "내담자"]
SenderType = Literal["BOT", "USER"]
Role = Literal["assistant", "user", "system"]


def normalize_sender(speaker: str) -> Optional[SenderType]:
    if speaker == "상담사":
        return "BOT"
    if speaker == "내담자":
        return "USER"
    return None


def normalize_role(speaker: str) -> Optional[Role]:
    if speaker == "상담사":
        return "assistant"
    if speaker == "내담자":
        return "user"
    return None


def clean_text(text: Any) -> str:
    if text is None:
        return ""
    s = str(text)
    return s.strip()


def parse_line(line: str) -> List[Dict[str, Any]]:
    line = line.strip()
    if not line:
        return []
    obj = json.loads(line)
    if not isinstance(obj, list):
        raise ValueError("Each line must be a JSON array of turns.")
    return obj


def to_messages(turns: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    app_msgs: List[Dict[str, Any]] = []
    ft_msgs: List[Dict[str, Any]] = []

    for t in turns:
        speaker = t.get("speaker")
        utterance = clean_text(t.get("utterance"))
        if not utterance:
            continue

        sender = normalize_sender(speaker)
        role = normalize_role(speaker)
        if sender is None or role is None:
            continue

        app_msgs.append({"senderType": sender, "content": utterance})
        ft_msgs.append({"role": role, "content": utterance})

    return app_msgs, ft_msgs


def main() -> None:
    # fastapi/scripts/this.py → repo root = parents[2]
    root = pathlib.Path(__file__).resolve().parents[2]
    src = root / "total_kor_multiturn_counsel_bot.jsonl"
    out_dir = root / "data"
    out_dir.mkdir(exist_ok=True)

    out_app = out_dir / "matey_counsel_multiturn_messages.jsonl"
    out_ft = out_dir / "matey_counsel_multiturn_finetune.jsonl"

    system_prompt = (
        "너는 Matey(메이티)야. 너의 목표는 '상담'이 아니라 친구처럼 공감하고 대화를 이어가며 "
        "사용자가 스스로 감정을 정리할 수 있도록 돕는 거야. 단정/훈계/과한 처방을 피하고, "
        "필요하면 전문기관 도움을 권유해."
    )

    total_in = 0
    total_out = 0

    with src.open("r", encoding="utf-8") as f_in, \
        out_app.open("w", encoding="utf-8") as f_app, \
        out_ft.open("w", encoding="utf-8") as f_ft:
        for raw in f_in:
            total_in += 1
            raw = raw.strip()
            if not raw:
                continue

            turns = parse_line(raw)
            app_msgs, ft_msgs = to_messages(turns)
            if len(app_msgs) < 2:
                continue

            f_app.write(
                json.dumps(
                    {
                        "domain": "counsel",
                        "source": "total_kor_multiturn_counsel_bot",
                        "messages": app_msgs,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

            f_ft.write(
                json.dumps(
                    {
                        "messages": [{"role": "system", "content": system_prompt}, *ft_msgs],
                        "metadata": {
                            "domain": "counsel",
                            "source": "total_kor_multiturn_counsel_bot",
                            "language": "ko",
                        },
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

            total_out += 1

    print(f"Converted {total_out} conversations (from {total_in} lines).")
    print(f"- {out_app.relative_to(root)}")
    print(f"- {out_ft.relative_to(root)}")
    print("반말/존댓말 분리·ASCII 경로: node scripts/convert_counsel_jsonl.mjs")


if __name__ == "__main__":
    main()
