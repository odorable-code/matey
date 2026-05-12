package kr.hi.matey.controller;

import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.PostCreateRequestDTO;
import kr.hi.matey.dto.PostDTO;
import kr.hi.matey.dto.AssignableBotOption;
import kr.hi.matey.dto.CategoryDTO;
import kr.hi.matey.dto.NoticeFeedItemDTO;
import kr.hi.matey.service.CommunityService;
import kr.hi.matey.service.NoticeService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final NoticeService noticeService;

    private static void requireLoginPrincipal(CustomUser user) {
        if (user == null || user.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요.");
        }
    }

    private static Long resolveViewerId(CustomUser user) {
        if (user == null || user.getUser() == null) {
            return null;
        }
        return user.getUser().getUserId();
    }

    // 1) 카테고리 목록
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getCategories() {
        return ResponseEntity.ok(communityService.getCategories());
    }

    /** 메인 랜딩·채팅 메이트 픽: BOT 테이블과 동일 (관리자 상담봇 관리와 연동) */
    @GetMapping("/bots/landing")
    public ResponseEntity<List<AssignableBotOption>> getLandingBots() {
        return ResponseEntity.ok(communityService.listPublicLandingBots());
    }

    // 2) 게시글 목록
    @GetMapping("/posts")
    public ResponseEntity<List<PostDTO>> getPosts(
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "keyword", required = false, defaultValue = "") String keyword,
            @RequestParam(name = "limit", defaultValue = "20") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset,
            @RequestParam(name = "includeNotice", required = false, defaultValue = "false") boolean includeNotice,
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(
                communityService.getPosts(categoryId, keyword, limit, offset, resolveViewerId(user), includeNotice)
        );
    }

    // 3) 게시글 작성
    @PostMapping("/posts")
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody PostCreateRequestDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        String roleCode = user.getUser().getRoleCode();
        Long postId = communityService.createPost(dto, userId, roleCode);

        return ResponseEntity.ok(Map.of("postId", postId));
    }

    // 3-1) 게시글 수정(작성자만)
    @PutMapping("/posts/{postId}")
    public ResponseEntity<String> updatePost(
            @PathVariable("postId") Long postId,
            @RequestBody PostCreateRequestDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        String roleCode = user.getUser().getRoleCode();
        communityService.updatePost(postId, dto, userId, roleCode);
        return ResponseEntity.ok("updated");
    }

    // 3-2) 게시글 삭제(작성자만)
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        communityService.deletePost(postId, userId);
        return ResponseEntity.ok("deleted");
    }

    // 4) 게시글 상세 + 댓글 목록
    @GetMapping("/posts/{postId}")
    public ResponseEntity<Map<String, Object>> getPostDetailWithComments(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(communityService.getPostDetailWithComments(postId, resolveViewerId(user)));
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Map<String, Object>> togglePostLike(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(communityService.togglePostLike(postId, user.getUser().getUserId()));
    }

    @PostMapping("/posts/{postId}/dislike")
    public ResponseEntity<Map<String, Object>> togglePostDislike(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(communityService.togglePostDislike(postId, user.getUser().getUserId()));
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(
                communityService.toggleCommentLike(postId, commentId, user.getUser().getUserId())
        );
    }

    // 6) 공지사항 목록
    @GetMapping("/notices")
    public ResponseEntity<List<NoticeFeedItemDTO>> getNotices() {
        return ResponseEntity.ok(noticeService.getNoticeFeed());
    }

    // 5) 댓글 작성
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Void> createComment(
            @PathVariable("postId") Long postId,
            @RequestBody CommentCreateRequestDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        communityService.createComment(postId, dto, userId);
        return ResponseEntity.ok().build();
    }

    // 댓글 수정(작성자만)
    @PutMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<String> updateComment(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @RequestBody CommentCreateRequestDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        // postId는 경로 안정성용(검증은 DAO WHERE user_id로만 처리)
        communityService.updateComment(commentId, dto, userId);
        return ResponseEntity.ok("updated");
    }

    // 댓글 삭제(작성자만)
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<String> deleteComment(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal CustomUser user
    ) {
        requireLoginPrincipal(user);
        long userId = user.getUser().getUserId();
        communityService.deleteComment(commentId, userId);
        return ResponseEntity.ok("deleted");
    }

    // 댓글만 별도로 가져오기(프론트 구성에 따라 사용)
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<kr.hi.matey.dto.CommentDTO>> getComments(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(communityService.getComments(postId, resolveViewerId(user)));
    }

    /** 카테고리명에「고민」이 포함된 글 무작위 추첨 */
    @GetMapping("/spotlight/worry-draw")
    public ResponseEntity<Map<String, Object>> drawRandomWorryPost(
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(communityService.drawRandomWorryPost(resolveViewerId(user)));
    }

    /** 관리자 지정 고민 스포트라이트 + 운영 답변 (비로그인 조회 가능) */
    @GetMapping("/spotlight/worry-featured")
    public ResponseEntity<Map<String, Object>> getWorryFeatured(
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(communityService.getWorryFeatured(resolveViewerId(user)));
    }

    /** 카테고리명에「사연」이 포함된 글 무작위 추첨 */
    @GetMapping("/spotlight/story-draw")
    public ResponseEntity<Map<String, Object>> drawRandomStoryPost(
            @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(communityService.drawRandomStoryPost(resolveViewerId(user)));
    }

    /** 전월 봇 추천(좋아요) 이벤트 집계 순위 (BOT_RECOMMEND_EVENT, 연·월은 서버 기준 직전 달) */
    @GetMapping("/spotlight/bot-ranking/monthly")
    public ResponseEntity<Map<String, Object>> getPreviousMonthBotRanking(
            @AuthenticationPrincipal CustomUser user,
            Authentication authentication
    ) {
        String roleCode =
                user != null && user.getUser() != null ? user.getUser().getRoleCode() : null;
        return ResponseEntity.ok(
                communityService.getPreviousMonthBotRanking(
                        roleCode,
                        authentication != null ? authentication.getAuthorities() : null
                )
        );
    }

    /** 연말 인기봇 순위(BOT_POPULARITY_STAT, 없으면 BOT.like_count) */
    @GetMapping("/spotlight/bot-ranking")
    public ResponseEntity<Map<String, Object>> getYearEndBotRanking(
            @RequestParam(name = "year", required = false) Integer year,
            @AuthenticationPrincipal CustomUser user,
            Authentication authentication
    ) {
        String roleCode =
                user != null && user.getUser() != null ? user.getUser().getRoleCode() : null;
        return ResponseEntity.ok(
                communityService.getYearEndBotRanking(
                        year,
                        roleCode,
                        authentication != null ? authentication.getAuthorities() : null
                )
        );
    }

    /** 봇 추천: 없으면 좋아요, 싫어요였으면 추천으로 전환, 이미 추천이면 추천 취소. 로그인 필요 */
    @PostMapping("/spotlight/bots/{botId}/recommend")
    public ResponseEntity<Map<String, Object>> recommendBot(
            @PathVariable("botId") Long botId,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요해요."
            );
        }
        if (botId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "봇을 선택해 주세요."
            );
        }
        long userId = user.getUser().getUserId();
        return ResponseEntity.ok(communityService.addBotRecommend(botId, userId));
    }

    /** 봇 싫어요: 없으면 싫어요, 추천이었으면 싫어요로 전환, 이미 싫어요면 싫어요 취소. 로그인 필요 */
    @PostMapping("/spotlight/bots/{botId}/dislike")
    public ResponseEntity<Map<String, Object>> dislikeBot(
            @PathVariable("botId") Long botId,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요해요."
            );
        }
        if (botId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "봇을 선택해 주세요."
            );
        }
        long userId = user.getUser().getUserId();
        return ResponseEntity.ok(communityService.addBotDislike(botId, userId));
    }

    /** 로그인 사용자의 봇 추천·싫어요 목록 (새로고침 후 UI 동기화용) */
    @GetMapping("/spotlight/my-bot-reactions")
    public ResponseEntity<Map<String, Object>> getMyBotReactions(
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요해요."
            );
        }
        return ResponseEntity.ok(communityService.getMyBotReactions(user.getUser().getUserId()));
    }
}

