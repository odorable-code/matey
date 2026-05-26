# Matey (메이티)

> **RAG 기반 심리·고민 상담 캐릭터 챗봇 서비스**

사용자가 캐릭터와 대화하며 심리적·일상적 고민을 나눌 수 있는 챗봇 웹 서비스입니다.
Gemini 2.5 Flash와 Chroma DB를 활용한 RAG 파이프라인으로, 캐릭터별 일관된 페르소나와 맥락 있는 응답을 제공합니다.

`패스트캠퍼스 풀스택 개발자 양성과정` · `팀 프로젝트` · `2026.05 ~ 2026.06`

---

## 아키텍처

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────┐
│   React     │ ─────▶ │   Spring Boot    │ ─────▶ │     FastAPI     │
│  (Frontend) │        │  (Main API)      │        │   (AI Server)   │
└─────────────┘        └──────────────────┘        └─────────────────┘
                                │                            │
                                ▼                            ▼
                        ┌──────────────┐           ┌──────────────────┐
                        │    MySQL     │           │   Chroma DB      │
                        │ (User Data)  │           │  (Vector Store)  │
                        └──────────────┘           └──────────────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │  Gemini 2.5      │
                                                   │  Flash API       │
                                                   └──────────────────┘
```

3-tier 구조로 책임을 분리했습니다.

- **React** — UI 렌더링 및 사용자 상호작용
- **Spring Boot** — 회원·상담 내역 등 메인 비즈니스 로직, MySQL 영속성 관리
- **FastAPI** — LLM 호출 및 RAG 파이프라인 전담 (Python 생태계 활용)

---

## 기술 스택

### Backend (Main API)
- **Java**, **Spring Boot**
- **MySQL**

### AI Server
- **Python**, **FastAPI**
- **Gemini 2.5 Flash** (응답 생성 LLM)
- **Gemini Embedding** (임베딩 모델)
- **Chroma DB** (벡터 데이터베이스)

### Frontend
- **React**

---

## 주요 기능

### RAG 기반 캐릭터 챗봇
- 시스템 프롬프트와 캐릭터별 RAG 컨텍스트를 분리하여 단일 캐릭터의 응답 일관성을 확보
- 사용자 발화를 임베딩해 Chroma DB에서 관련 컨텍스트 검색 후 Gemini에 전달

### 심리·고민 상담
- 일반 고민 상담 및 정서 지원을 위한 대화 흐름 설계
- 상담 메시지는 별도 저장 구조로 관리

### 마이페이지
- 회원 정보 관리
- 상담 내역 조회

### DB 보안 설계
- 상담 데이터의 민감 정보 특성을 고려한 사전 보안 설계 진행
- 설계 문서 별도 정리: [`상담서비스_DB_보안설계_정리.md`](./상담서비스_DB_보안설계_정리.md)

---

## 프로젝트 구조

```
matey/
├── backend/           # Spring Boot 메인 API 서버
├── fastapi/           # FastAPI AI 서버 (RAG + Gemini)
├── frontend/          # React 프론트엔드
├── data/              #
├── scripts/
├── test-sql/
├── docs/
└── 프로젝트 DB.sql 
```
---

## 실행 방법

각 디렉터리(`backend`, `fastapi`, `frontend`)별 README 또는 설정 파일을 참고해 주세요.

```bash
# Spring Boot
cd backend
./gradlew bootRun

# FastAPI
cd fastapi
uvicorn main:app --reload

# React
cd frontend
npm install
npm start
```

---

## 라이선스

본 프로젝트는 학습 및 포트폴리오 목적으로 개발되었습니다.
