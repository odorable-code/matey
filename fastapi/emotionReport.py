ANTHROPIC_API_KEY=''

# 설치했으면 주석 처리
pip install anthropic

# AWS Bedrock 지원용
pip install anthropic[bedrock]
# Vertex AI 연동 (anthropic vertex extra)
pip install anthropic[vertex]
# aiohttp 를 사용하여 비동기 성능을 향상시키려는 경우
pip install anthropic[aiohttp]

import os
from anthropic import Anthropic

client = Anthropic(
    # 기본값이며 생략 가능합니다.
    # 설정되지 않은 경우 환경변수 ANTHROPIC_API_KEY를 찾습니다.
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    message = client.messages.create(
    max_tokens=1024,
    messages=[
    {
     "role": "user",
            "content": "Hello, Claude",
        }
    ],
    model="claude-3-5-sonnet-20240620",
    )
    print(message.content)
)