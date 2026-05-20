import json
import csv
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any

from config import config


@dataclass
class Document:
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """텍스트를 겹치는 청크로 분할합니다."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def _row_to_text(row: dict[str, Any]) -> str:
    """딕셔너리 행을 읽기 좋은 텍스트로 변환합니다."""
    parts = [f"{key}: {value}" for key, value in row.items() if value is not None and str(value).strip()]
    return " | ".join(parts)


def load_json(file_path: str) -> list[Document]:
    """JSON 또는 JSONL 파일에서 문서를 로드합니다."""
    path = Path(file_path)
    documents: list[Document] = []

    with open(path, encoding="utf-8") as f:
        if path.suffix == ".jsonl":
            raw = [json.loads(line) for line in f if line.strip()]
        else:
            raw = json.load(f)

    if isinstance(raw, dict):
        raw = [raw]

    for i, item in enumerate(raw):
        if isinstance(item, str):
            text = item
        elif isinstance(item, dict):
            # "text", "content", "body" 키를 우선 사용, 없으면 전체 행 직렬화
            text = item.get("text") or item.get("content") or item.get("body") or _row_to_text(item)
        else:
            text = str(item)

        metadata = {"source": path.name, "index": i}
        if isinstance(item, dict):
            for key in ("id", "title", "category", "label", "url"):
                if key in item:
                    metadata[key] = str(item[key])

        for chunk in _chunk_text(str(text), config.CHUNK_SIZE, config.CHUNK_OVERLAP):
            documents.append(Document(content=chunk, metadata={**metadata}))

    return documents


def load_csv(file_path: str, text_columns: list[str] | None = None) -> list[Document]:
    """CSV 파일에서 문서를 로드합니다.

    text_columns가 주어지면 해당 열만 본문으로 사용합니다.
    주어지지 않으면 모든 열을 key: value 형식으로 직렬화합니다.
    """
    path = Path(file_path)
    documents: list[Document] = []

    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for i, row in enumerate(rows):
        if text_columns:
            parts = [str(row.get(col, "")) for col in text_columns if row.get(col)]
            text = " ".join(parts)
        else:
            text = _row_to_text(dict(row))

        if not text.strip():
            continue

        metadata = {"source": path.name, "row": i}
        for key in ("id", "title", "category", "label", "name", "url"):
            if key in row and row[key]:
                metadata[key] = str(row[key])

        for chunk in _chunk_text(text, config.CHUNK_SIZE, config.CHUNK_OVERLAP):
            documents.append(Document(content=chunk, metadata={**metadata}))

    return documents


def load_file(file_path: str, **kwargs) -> list[Document]:
    """확장자를 보고 자동으로 적절한 로더를 선택합니다."""
    ext = Path(file_path).suffix.lower()
    if ext in (".json", ".jsonl"):
        return load_json(file_path)
    if ext == ".csv":
        return load_csv(file_path, **kwargs)
    raise ValueError(f"지원하지 않는 파일 형식: {ext} (지원: .json, .jsonl, .csv)")
