# 커뮤니티·지원·관리자 백엔드 변경 요약 (쉬운 정리)

이 문서는 `community_backend_changes_summary.md`의 내용을 한국어로 풀어서 정리한 것입니다.  
**데이터베이스 스크립트(`DB 초안.sql`) 자체는 건드리지 않았고**, 코드·MyBatis 매퍼·DTO를 스키마에 맞춘 변경입니다.

---

## 한눈에 보기

| 구분 | 무엇을 했나 |
|------|-------------|
| 커뮤니티 | 게시글·댓글 CRUD, 목록·상세 API 추가 |
| 문의/신고·FAQ | DB 초안에 맞게 테이블·DTO·쿼리 정리, 관리자 FAQ·답변 API 보강 |
| 공지 | `ADMIN_NOTICE` 기반 공지 API 추가 |
| 제거 | 관리자 사용자 로그 API, 반응·타로 등 커뮤니티 부가 기능(미구현 처리) |
| 권한 | 관리자 역할이 로그인 세션에 제대로 실리도록 수정 |
| 기타 | 잘못된 파일 위치 정리, 빌드 깨지던 MyPage 메서드 추가 |

---

## 1. 커뮤니티 API (게시글 / 댓글)

**역할:** 사용자가 카테고리별로 글을 올리고, 댓글을 달 수 있게 하는 백엔드입니다.

**주요 파일**

- 컨트롤러: `CommunityController.java`
- 서비스: `CommunityService.java`
- DAO/매퍼: `PostDAO` + `PostMapper.xml`, `CommentDAO` + `CommentMapper.xml`

**엔드포인트 요약**

- 카테고리 목록: `GET /api/community/categories`
- 게시글 목록: `GET /api/community/posts` (카테고리·검색어·페이지 파라미터 선택)
- 게시글 작성: `POST /api/community/posts`
- 게시글 상세(댓글 포함): `GET /api/community/posts/{postId}`
- 게시글 수정·삭제: `PUT` / `DELETE` … `/posts/{postId}` — **작성자만** (SQL에서 `user_id`로 제한)
- 댓글 목록·작성·수정·삭제: `…/posts/{postId}/comments` 및 `…/comments/{commentId}` — 수정·삭제도 **작성자만**

---

## 2. 문의·신고(Support)와 관리자 FAQ — DB 초안과 맞춤

### 왜 바꿨나

기존 코드를 **`SUPPORT`, `SUPPORT_REASON`, `SUPPORT_ANSWER`, `ADMIN_FAQ`** 테이블 구조에 맞게 정리했습니다.

### DTO (데이터 전달 객체)

- **SupportDTO** — 문의 한 건: 예) 문의 ID, 사용자, 제목, 내용, 상태, 사유 ID/이름, 답변 내용, 작성일 등.
- **FaqDTO** — FAQ: 질문, 답변, 생성·수정 시각.
- **SupportReasonDTO** — 문의/신고 **사유 목록** 한 줄.

### DB 접근 (DAO / Mapper)

- 문의 목록은 `SUPPORT`를 읽고 `SUPPORT_REASON`과 조인.
- 최신 **답변 텍스트**는 `SUPPORT_ANSWER`에서 가져와 `answerContent`로 노출.
- FAQ CRUD는 **`ADMIN_FAQ`** 테이블 기준으로 이동·정리.
- 새 문의 등록 시 `SUPPORT`에 넣고 `support_reason_id` 사용.
- 활성 사유만 목록으로: `selectSupportReasons`.

### 서비스·컨트롤러에서 달라진 점

- 새 문의의 초기 상태는 **`PENDING`**.
- 사용자용: 사유 목록 `GET /api/mypage/support/reasons`.
- 관리자용 FAQ: 목록·생성·수정 (`GET/POST /api/admin/faqs`, `PUT /api/admin/faqs/{faqId}`).
- 관리자가 문의에 답변: `POST /api/admin/feedbacks/{supportId}/answer`.
- 사용자 역할 변경(`PATCH /api/admin/users/{userId}/role`)은 **`SUPER_ADMIN`만** 가능하도록 정리.

---

## 3. 공지 (ADMIN_NOTICE)

**역할:** 커뮤니티에서 보여 줄 공지와, 관리자용 공지 작성·수정.

- **사용자:** 게시된 공지만 `GET /api/community/notices`.
- **관리자:** `POST /api/admin/notices`, `PUT /api/admin/notices/{noticeId}`.

관련 코드: `AdminNoticeDTO`, `NoticeDAO`, `NoticeMapper.xml`, `NoticeService`.

---

## 4. 관리자 “사용자 로그” 기능 제거

- **`/api/admin/logs`** API 삭제.
- 서비스에서 관리자 행동을 남기던 **`insertAdminLog` 호출 제거**.
- `AdminService`, `AdminDAO`, `AdminMapper.xml` 등에서 반영.

---

## 5. 잘못 생긴 파일 정리

프로젝트 **루트**에 실수로 두었던 `matey/dao/CommentDAO.java`는 삭제했습니다.  
실제로 쓰는 DAO는 **`backend/src/main/java/kr/hi/matey/dao/CommentDAO.java`**입니다.

---

## 6. 관리자 권한이 안 먹던 문제 수정

**문제:** 로그인 시 사용자 정보를 가져오는 쿼리(`AuthMapper.selectUser`)에 **역할(role)** 이 없어서, `CustomUser`에 `ADMIN` / `SUPER_ADMIN` 이 제대로 안 실릴 수 있었습니다.

**조치 요약**

- `UserVO`에 **`roleCode`** 추가.
- `AuthMapper.xml`의 `selectUser`에서 **`ROLE.role_code` 조인·조회**.
- `CustomUser`가 이 `roleCode`로 권한을 만들도록 정리.
- `AdminController`의 역할 검사를 **`getRoleCode()`** 기준으로 통일.
- `GET /me` 응답에도 **`roleCode`** 포함 (`AuthController`).

---

## 7. MyPage — 컴파일용 메서드 추가

`MyPageService`가 **`myPageDAO.updateBotExp(...)`** 를 호출하는데 DAO/매퍼에 없어 빌드가 깨졌습니다.  
`MyPageDAO`와 `MyPageMapper.xml`에 **`updateBotExp`** 를 추가해 빌드가 되도록 맞춤.

---

## 8. 빌드 확인

백엔드에서 **`./gradlew build -x test`** 가 성공한 상태까지 확인했습니다.

---

## 빠진 것 / 의도적으로 안 한 것

- **커뮤니티 반응(좋아요 등), 타로 관련 백엔드** — 이번에 구현하지 않았거나 비활성 상태로 둠.

---

*상세 엔드포인트·파일 경로는 원문 `community_backend_changes_summary.md`를 참고하면 됩니다.*
