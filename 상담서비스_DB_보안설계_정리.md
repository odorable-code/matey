# 상담 서비스 DB/보안 설계 정리

## 1. 서비스 요구사항 요약

현재 서비스는 다음 흐름을 목표로 한다.

- 채팅방에서 사용자와 봇이 상담 진행
- 사용자는 봇 메시지에 좋아요/싫어요 평가 남김
- 사용자가 보낸 메시지는 감정 분석 후, 분석 결과를 기반으로 상담 지속
- 감정 분석 결과를 사용자 대시보드(주/월/년) 표와 그래프에 반영
- 월간/연간 이벤트에서 고민 일부를 요약하여 보여주고 "태우기(삭제)" 수행
- 사용자가 과거 상담을 다시 볼 수 있으나, 보관 기간이 지나면 삭제
- 상담 내용 기반으로 봇이 사용자에게 쪽지 발송

핵심은 **상담 원문 저장**, **분석 데이터 저장**, **이벤트/삭제 정책**, **보안/암호화**를 분리해 설계하는 것이다.

---

## 2. 저장 전략(권장)

결론적으로 아래 전략이 가장 안전하고 운영하기 쉽다.

1. 메시지 원문은 암호화하여 저장
2. 통계/대시보드에는 분석 결과(비식별 중심)만 사용
3. 이벤트 요약은 별도 저장
4. 보관 기간 만료 시 원문부터 우선 삭제

즉, **원문 데이터와 분석/통계 데이터를 분리**해야 성능, 보안, 삭제 정책을 동시에 만족할 수 있다.

---

## 3. 권장 테이블 구조

아래는 추천 테이블과 주요 컬럼이다.

### 3.1 사용자/채팅 기본

#### `users`
- `id` (PK)
- `created_at`, `updated_at`
- 개인정보 컬럼은 최소화(필요 시 별도 암호화)

#### `chat_rooms`
- `id` (PK)
- `user_id` (FK)
- `title`
- `status` (`active`, `archived`, `deleted`)
- `last_message_at`
- `retention_policy_id` (FK)
- `created_at`, `updated_at`

### 3.2 메시지/평가

#### `chat_messages`
- `id` (PK)
- `room_id` (FK)
- `sender_type` (`user`, `bot`, `system`)
- `ciphertext` (메시지 암호문)
- `iv_nonce`, `auth_tag` (AEAD 복호화용)
- `key_version` (키 로테이션 대응)
- `created_at`
- `expires_at` (삭제 기준 시각)
- `deleted_at` (소프트 삭제용)

#### `message_feedback`
- `id` (PK)
- `message_id` (FK, 주로 bot 메시지)
- `user_id` (FK)
- `feedback_type` (`like`, `dislike`)
- `reason_code` (선택)
- `comment_ciphertext` (선택, 코멘트 암호화)
- `created_at`

### 3.3 감정 분석/주제

#### `emotion_analyses`
- `id` (PK)
- `message_id` (FK, user 메시지)
- `user_id` (FK)
- `room_id` (FK)
- `emotion_label`
- `emotion_score`
- `sentiment_polarity`
- `confidence`
- `analysis_model`, `analysis_version`
- `created_at`

#### `concern_topics`
- `id` (PK)
- `name`
- `category`

#### `message_topics`
- `message_id` (FK)
- `topic_id` (FK)
- `weight`

도넛 그래프(고민 주제 비율)는 주로 `message_topics` 집계로 구성한다.

### 3.4 이벤트/요약/쪽지

#### `period_summaries`
- `id` (PK)
- `user_id` (FK)
- `period_type` (`monthly`, `yearly`)
- `period_start`, `period_end`
- `summary_ciphertext` (요약문 암호화)
- `selected_message_ids_json` (이벤트 대상 메시지)
- `burn_status` (`pending`, `burned`)
- `burned_at`
- `created_at`

#### `bot_notes`
- `id` (PK)
- `user_id` (FK)
- `source_period_start`, `source_period_end`
- `note_ciphertext`
- `note_type` (`encouragement`, `reflection`, `checkin`)
- `created_at`
- `read_at`
- `expires_at`

### 3.5 보관/삭제 정책

#### `retention_policies`
- `id` (PK)
- `name`
- `message_ttl_days`
- `summary_ttl_days`
- `monthly_burn_delete_scope` (`selected_only`)
- `yearly_burn_delete_scope` (`all_in_period`)
- `created_at`, `updated_at`

---

## 4. "전체 상담 JSON 저장"에 대한 권장 방식

전체 대화를 JSON 한 덩어리로만 저장하면 다음 문제가 생길 수 있다.

- 부분 조회/검색 어려움
- 일부 메시지만 삭제하기 어려움
- 인덱싱/성능 저하
- 접근 제어 단위가 커져 보안 관리 부담 증가

따라서 운영 DB에서는 메시지를 행 단위(`chat_messages`)로 저장하고,  
필요하면 이벤트 생성 시점에만 스냅샷 JSON을 별도 저장하는 방식을 권장한다.

---

## 5. 월간/연간 "태우기(삭제)" 정책

요구사항 반영 예시는 다음과 같다.

- 월간 이벤트: 선택된 고민(메시지)만 삭제
- 연간 이벤트: 해당 기간 상담 메시지 전체 삭제

실무 권장 흐름:

1. 소프트 삭제(`deleted_at`) 처리
2. 유예 기간 후 하드 삭제 배치
3. 삭제 이력 테이블(`burn_jobs` 등)로 감사 가능하게 관리

---

## 6. 보안/비밀보장 핵심 가이드

### 6.1 암호화

- DB 저장 전 애플리케이션 레벨 암호화 적용
- 권장 알고리즘: AES-256-GCM(또는 동급 AEAD)
- 메시지별 고유 nonce/iv 사용
- `key_version` 필수(키 로테이션 대응)

### 6.2 키 관리

- 키는 DB가 아닌 KMS/Vault에 보관
- DEK/KEK 구조 사용
- 키 접근 권한 최소화(서버 서비스 계정만)

### 6.3 접근 통제/감사

- 사용자 본인 데이터만 접근 가능하도록 강제
- 운영자 원문 조회는 최소화 + 승인 절차
- 누가 언제 복호화/조회했는지 감사 로그 기록
- 로그에 원문/복호문 출력 금지

---

## 7. 대시보드 집계(주/월/년, 도넛 그래프)

원천 테이블에서 매번 실시간 계산하면 느릴 수 있다.  
따라서 집계 테이블(또는 materialized view) 운영을 권장한다.

예시:

- `emotion_stats_daily`
- `emotion_stats_weekly`
- `emotion_stats_monthly`
- `topic_stats_monthly`

배치 또는 증분 업데이트로 사용자 대시보드 응답 속도를 안정화할 수 있다.

---

## 8. 상담 흐름(백엔드 처리 파이프라인)

1. 사용자 메시지 수신
2. 원문 암호화 저장 (`chat_messages`)
3. 감정/주제 분석 결과 저장 (`emotion_analyses`, `message_topics`)
4. 분석 결과를 기반으로 봇 응답 생성
5. 봇 응답 암호화 저장 + 사용자 평가 연결 (`message_feedback`)

이 구조는 기능 요구사항과 보안 요구사항을 동시에 만족시키기 좋다.

---

## 9. 최종 권장 방향

현재 고민 방향은 매우 적절하다.  
특히 아래 3가지는 반드시 유지하는 것이 좋다.

- 원문 암호화 저장
- 분석 결과 분리 저장
- 기간/이벤트 기반 삭제 정책

추가로, 운영 안정성을 위해 **원문/분석/요약/집계를 테이블로 분리**하고,  
삭제 정책을 테이블과 배치 작업으로 명확히 모델링하면 이후 확장(쪽지, 그래프, 이벤트)까지 수월해진다.

