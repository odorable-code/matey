#!/usr/bin/env python3
"""멍이 RAG 챗봇 CLI"""

import argparse
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

from config import config
from document_loader import load_file
from vector_store import VectorStore
from rag_chatbot import RAGChatbot

console = Console()


# ------------------------------------------------------------------
# 서브커맨드: index
# ------------------------------------------------------------------

def cmd_index(args: argparse.Namespace) -> None:
    """문서를 벡터 DB에 인덱싱합니다."""
    store = VectorStore()

    if args.reset:
        store.reset()
        console.print("[yellow]기존 컬렉션을 초기화했습니다.[/yellow]")

    kwargs = {}
    if args.text_columns:
        kwargs["text_columns"] = [c.strip() for c in args.text_columns.split(",")]

    total = 0
    for file_path in args.files:
        if not Path(file_path).exists():
            console.print(f"[red]파일을 찾을 수 없습니다: {file_path}[/red]")
            continue
        with console.status(f"[cyan]로딩 중: {file_path}[/cyan]"):
            docs = load_file(file_path, **kwargs)
        with console.status(f"[cyan]인덱싱 중: {len(docs)}개 청크...[/cyan]"):
            added = store.add_documents(docs)
        total += added
        console.print(f"[green]✓[/green] {file_path} → {added}개 청크 추가")

    console.print(f"\n[bold green]총 {total}개 청크 인덱싱 완료. DB 전체: {store.count()}개[/bold green]")


# ------------------------------------------------------------------
# 서브커맨드: chat
# ------------------------------------------------------------------

def cmd_chat(args: argparse.Namespace) -> None:
    """대화형 RAG 챗봇을 시작합니다."""
    store = VectorStore()
    if store.count() == 0:
        console.print("[red]벡터 DB가 비어 있습니다. 먼저 `python main.py index <파일>` 을 실행하세요.[/red]")
        sys.exit(1)

    bot = RAGChatbot(store=store)
    console.print(Panel(
        f"[bold cyan]🐾 멍이 RAG 챗봇[/bold cyan]\n"
        f"모델: {config.CHAT_MODEL} | 임베딩: {config.EMBEDDING_MODEL}\n"
        f"DB 청크 수: {store.count()} | Top-K: {args.top_k}\n"
        "[dim]종료: exit / quit | 히스토리 초기화: /clear | 참조 보기: /refs on|off[/dim]",
        border_style="cyan",
    ))

    show_refs = args.show_refs

    while True:
        try:
            question = console.input("[bold blue]You:[/bold blue] ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]종료합니다.[/dim]")
            break

        if not question:
            continue
        if question.lower() in ("exit", "quit"):
            break
        if question.lower() == "/clear":
            bot.clear_history()
            console.print("[yellow]대화 히스토리를 초기화했습니다.[/yellow]")
            continue
        if question.lower().startswith("/refs"):
            parts = question.split()
            show_refs = parts[1].lower() == "on" if len(parts) > 1 else not show_refs
            console.print(f"[yellow]참조 표시: {'on' if show_refs else 'off'}[/yellow]")
            continue

        console.print("[bold green]Bot:[/bold green] ", end="")
        chunks: list[dict] = []

        # 스트리밍 출력
        answer_parts = []
        for token in bot.stream_chat(question, top_k=args.top_k):
            console.print(token, end="", markup=False)
            answer_parts.append(token)

        # stream_chat은 내부적으로 chunks를 저장하지 않으므로 non-streaming로 refs 확인
        # refs가 필요할 때만 별도 query
        console.print()

        if show_refs:
            ref_chunks = store.query(question, top_k=args.top_k)
            table = Table(title="참조 문서", show_lines=True, title_style="dim")
            table.add_column("순위", style="dim", width=4)
            table.add_column("출처", style="cyan")
            table.add_column("유사도", style="green", width=8)
            table.add_column("내용 (일부)", style="white")
            for rank, chunk in enumerate(ref_chunks, 1):
                meta = chunk["metadata"]
                source = meta.get("source", "?")
                loc = f"행 {meta['row']}" if "row" in meta else f"#{meta.get('index', '?')}"
                preview = chunk["content"][:80].replace("\n", " ") + ("…" if len(chunk["content"]) > 80 else "")
                table.add_row(str(rank), f"{source}\n{loc}", f"{chunk['score']:.3f}", preview)
            console.print(table)

        console.print()


# ------------------------------------------------------------------
# 서브커맨드: setup
# ------------------------------------------------------------------

def cmd_setup(args: argparse.Namespace) -> None:
    """data_rag.jsonl을 인덱싱하고 바로 챗봇을 시작합니다."""
    data_file = args.data_file
    if not Path(data_file).exists():
        console.print(f"[red]파일을 찾을 수 없습니다: {data_file}[/red]")
        sys.exit(1)

    store = VectorStore()

    if args.reset or store.count() == 0:
        if store.count() > 0:
            store.reset()
            console.print("[yellow]기존 컬렉션을 초기화했습니다.[/yellow]")

        with console.status(f"[cyan]로딩 중: {data_file}[/cyan]"):
            docs = load_file(data_file)
        with console.status(f"[cyan]인덱싱 중: {len(docs)}개 청크...[/cyan]"):
            added = store.add_documents(docs)
        console.print(f"[bold green]✓ {added}개 청크 인덱싱 완료 (DB 전체: {store.count()}개)[/bold green]")
    else:
        console.print(f"[dim]기존 DB 사용 중 (청크 수: {store.count()}). 재인덱싱하려면 --reset 옵션을 사용하세요.[/dim]")

    # 바로 챗 시작
    args.top_k = config.TOP_K
    args.show_refs = False
    cmd_chat(args)


# ------------------------------------------------------------------
# 서브커맨드: info
# ------------------------------------------------------------------

def cmd_info(_args: argparse.Namespace) -> None:
    store = VectorStore()
    console.print(Panel(
        f"[bold]설정 정보[/bold]\n"
        f"채팅 모델: {config.CHAT_MODEL}\n"
        f"임베딩 모델: {config.EMBEDDING_MODEL}\n"
        f"컬렉션: {config.COLLECTION_NAME}\n"
        f"DB 경로: {config.CHROMA_PERSIST_DIR}\n"
        f"청크 크기: {config.CHUNK_SIZE} | 오버랩: {config.CHUNK_OVERLAP}\n"
        f"Top-K: {config.TOP_K}\n"
        f"[bold green]저장된 청크 수: {store.count()}[/bold green]",
        title="RAG 챗봇 정보",
        border_style="blue",
    ))


# ------------------------------------------------------------------
# 진입점
# ------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="멍이 RAG 챗봇 🐾")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # setup (권장: 인덱싱 + 챗 한 번에)
    p_setup = subparsers.add_parser("setup", help="counseling_data_merged.jsonl 인덱싱 후 바로 챗봇 시작 (권장)")
    p_setup.add_argument(
        "data_file",
        nargs="?",
        default="counseling_data_merged.json",
        help="인덱싱할 JSONL 파일 (기본:  counseling_data_merged.json)",
    )
    p_setup.add_argument("--reset", action="store_true", help="기존 DB를 초기화하고 재인덱싱")
    p_setup.set_defaults(func=cmd_setup)

    # index
    p_index = subparsers.add_parser("index", help="JSON/CSV 파일을 벡터 DB에 인덱싱")
    p_index.add_argument("files", nargs="+", help="인덱싱할 파일 경로 (.json, .jsonl, .csv)")
    p_index.add_argument("--reset", action="store_true", help="기존 컬렉션을 삭제 후 재생성")
    p_index.add_argument(
        "--text-columns",
        help="CSV 전용: 본문으로 사용할 열 이름 (쉼표 구분, 기본: 전체 열)",
    )
    p_index.set_defaults(func=cmd_index)

    # chat
    p_chat = subparsers.add_parser("chat", help="대화형 RAG 챗봇 시작")
    p_chat.add_argument("--top-k", type=int, default=config.TOP_K, help="검색할 청크 수")
    p_chat.add_argument("--show-refs", action="store_true", default=False, help="참조 문서를 항상 표시")
    p_chat.set_defaults(func=cmd_chat)

    # info
    p_info = subparsers.add_parser("info", help="현재 설정 및 DB 상태 확인")
    p_info.set_defaults(func=cmd_info)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
