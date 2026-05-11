"""
이 스크립트는 fastapi/scripts/ 로 옮겼습니다.
  python fastapi/scripts/convert_counsel_jsonl.py
"""
import pathlib
import runpy
import sys

target = pathlib.Path(__file__).resolve().parent.parent / "fastapi" / "scripts" / "convert_counsel_jsonl.py"
if not target.is_file():
    print("fastapi/scripts/convert_counsel_jsonl.py 를 찾을 수 없어요.", file=sys.stderr)
    sys.exit(1)
runpy.run_path(str(target), run_name="__main__")
