# Community / Support / Admin backend changes summary

## Scope
- Implemented community (posts/comments) backend (CRUD + list/detail).
- Refactored “문의/신고” (SUPPORT + SUPPORT_REASON + SUPPORT_ANSWER) and ADMIN_FAQ handling to align with `DB 초안.sql`.
- Added admin APIs for FAQ and notices.
- Removed/disabled:
  - “user logs” management endpoint (`/api/admin/logs`) and related service logging behavior.
  - community reaction & tarot related backend features (left as not implemented).

> Note: `DB 초안.sql` itself was not modified. These changes are code + MyBatis mapper/DTO alignment and new endpoints.

---

## 1) New community APIs (posts / comments)

Controller: `backend/src/main/java/kr/hi/matey/controller/CommunityController.java`

Service: `backend/src/main/java/kr/hi/matey/service/CommunityService.java`

DAO/Mapper:
- `backend/src/main/java/kr/hi/matey/dao/PostDAO.java` + `backend/src/main/resources/mappers/PostMapper.xml`
- `backend/src/main/java/kr/hi/matey/dao/CommentDAO.java` + `backend/src/main/resources/mappers/CommentMapper.xml`

Endpoints:
- `GET  /api/community/categories` (CATEGORY list)
- `GET  /api/community/posts` (list, optional `categoryId`, optional `keyword`, `limit`, `offset`)
- `POST /api/community/posts` (create post)
- `GET  /api/community/posts/{postId}` (post detail + comments)
- `PUT  /api/community/posts/{postId}` (update post, author-only via `WHERE user_id = ?` in SQL)
- `DELETE /api/community/posts/{postId}` (delete post, author-only)
- `GET  /api/community/posts/{postId}/comments` (comments list)
- `POST /api/community/posts/{postId}/comments` (create comment)
- `PUT  /api/community/posts/{postId}/comments/{commentId}` (update comment, author-only)
- `DELETE /api/community/posts/{postId}/comments/{commentId}` (delete comment, author-only)

---

## 2) Support (문의/신고) and Admin FAQ refactor to match `DB 초안.sql`

### 2.1 DTO changes
- `backend/src/main/java/kr/hi/matey/dto/SupportDTO.java`
  - aligned to `SUPPORT` columns:
    - `supportId`, `userId`, `title`, `content`, `status`, `supportReasonId`, `reasonName`, `answerContent`, `createdAt`
- `backend/src/main/java/kr/hi/matey/dto/FaqDTO.java`
  - aligned to `ADMIN_FAQ`:
    - `faqId`, `question`, `answer`, `createdAt`, `updatedAt`
- Added:
  - `backend/src/main/java/kr/hi/matey/dto/SupportReasonDTO.java` (SUPPORT_REASON list items)

### 2.2 DAO/Mapper changes
- `backend/src/main/java/kr/hi/matey/dao/SupportDAO.java`
  - refactored methods to use:
    - `SUPPORT`, `SUPPORT_REASON`, `SUPPORT_ANSWER`, `ADMIN_FAQ`
- `backend/src/main/resources/mappers/SupportMapper.xml`
  - `selectSupportList`: now reads from `SUPPORT` and joins `SUPPORT_REASON`
  - includes latest `SUPPORT_ANSWER.content` as `answerContent`
  - `selectFaqList`, `selectFaqById`, `insertFaq`, `updateFaq` moved to `ADMIN_FAQ`
  - `insertSupportTicket`: inserts into `SUPPORT` with `support_reason_id`
  - `selectSupportReasons`: lists active reasons

### 2.3 Service changes
- `backend/src/main/java/kr/hi/matey/service/SupportService.java`
  - sets initial status to `PENDING`
  - added:
    - `getSupportReasons()`
    - `createFaq()`, `updateFaq()`, `getFaqById()`

### 2.4 Controller changes
- `backend/src/main/java/kr/hi/matey/controller/SupportController.java`
  - added `GET /api/mypage/support/reasons` to fetch reason types
- `backend/src/main/java/kr/hi/matey/controller/AdminController.java`
  - added/admin:
    - `GET  /api/admin/faqs`
    - `POST /api/admin/faqs`
    - `PUT  /api/admin/faqs/{faqId}`
    - `POST /api/admin/feedbacks/{supportId}/answer`
  - enforced `SUPER_ADMIN` only for:
    - `PATCH /api/admin/users/{userId}/role`

---

## 3) Admin notice (ADMIN_NOTICE) backend added

- DTO: `backend/src/main/java/kr/hi/matey/dto/AdminNoticeDTO.java`
- DAO/Mapper:
  - `backend/src/main/java/kr/hi/matey/dao/NoticeDAO.java`
  - `backend/src/main/resources/mappers/NoticeMapper.xml`
- Service: `backend/src/main/java/kr/hi/matey/service/NoticeService.java`
- APIs:
  - `GET  /api/community/notices` (published only)
  - `POST /api/admin/notices`
  - `PUT  /api/admin/notices/{noticeId}`

---

## 4) Removed “user logs” endpoint

- Removed `/api/admin/logs` and removed the service-layer “insertAdminLog(...)” calls.
- Updated:
  - `backend/src/main/java/kr/hi/matey/service/AdminService.java`
  - `backend/src/main/java/kr/hi/matey/dao/AdminDAO.java`
  - `backend/src/main/resources/mappers/AdminMapper.xml`

---

## 5) Clean-up: accidental top-level `dao/CommentDAO.java`

- A stray file was accidentally created at:
  - `matey/dao/CommentDAO.java` (project root)
- It was **deleted** because the real/used MyBatis DAO is under:
  - `backend/src/main/java/kr/hi/matey/dao/CommentDAO.java`

---

## 6) Build verification

- `backend`:
  - `./gradlew build -x test` succeeded after refactors.

