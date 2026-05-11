package kr.hi.matey.service;

import kr.hi.matey.dao.CommentDAO;
import kr.hi.matey.dao.CommunitySpotlightDAO;
import kr.hi.matey.dao.PostDAO;
import kr.hi.matey.dao.BotRecommendDAO;
import kr.hi.matey.dto.BotYearRankingDTO;
import kr.hi.matey.dto.CategoryDTO;
import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.CommentDTO;
import kr.hi.matey.dto.PostCreateRequestDTO;
import kr.hi.matey.dto.PostDTO;
import kr.hi.matey.util.RoleCodeHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunityService {

    private final PostDAO postDAO;
    private final CommentDAO commentDAO;
    private final PostViewIncrementService postViewIncrementService;
    private final CommunitySpotlightDAO communitySpotlightDAO;
    private final BotRecommendDAO botRecommendDAO;

    public List<CategoryDTO> getCategories() {
        try {
            List<CategoryDTO> list = postDAO.selectCategories();
            return list != null ? list : List.of();
        } catch (DataAccessException ex) {
            log.warn("getCategories: {}", ex.getMessage());
            return List.of();
        }
    }

    private static boolean isAdminRole(String roleCode) {
        return RoleCodeHelper.isAdminOrSuperAdmin(roleCode);
    }

    /** 커뮤니티 게시글 신규 작성·공지 카테고리 작성 허용 역할 */
    private static boolean isCommunityPostPublisherRole(String roleCode) {
        return RoleCodeHelper.isCommunityStaffPublisher(roleCode);
    }

    /** 연말 순위 안내(집계·테이블명 등)는 관리자에게만 노출 */
    private static boolean isAdminForRankingHint(
            String viewerRoleCode,
            Collection<? extends GrantedAuthority> authorities
    ) {
        if (isAdminRole(viewerRoleCode)) {
            return true;
        }
        if (authorities == null) {
            return false;
        }
        for (GrantedAuthority ga : authorities) {
            if (ga != null && RoleCodeHelper.isAdminOrSuperAdmin(ga.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /**
     * notification=0 인 카테고리: 공지/이벤트는 운영자(SUBADMIN 포함) 작성·수정 가능.
     */
    private void assertCategoryWritableByUser(Long categoryId, String roleCode) {
        if (categoryId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리를 선택해 주세요.");
        }
        Integer notification = postDAO.selectCategoryNotification(categoryId);
        if (notification == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 카테고리예요.");
        }
        if (notification != 0) {
            return;
        }
        String categoryName = postDAO.selectCategoryName(categoryId);
        String nameTrim = categoryName != null ? categoryName.trim() : "";
        boolean isEventCategory = "이벤트".equals(nameTrim);
        if (isEventCategory) {
            if (!isCommunityPostPublisherRole(roleCode)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "이벤트 카테고리에는 운영자만 글을 작성할 수 있어요."
                );
            }
            return;
        }
        if (!isCommunityPostPublisherRole(roleCode)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "공지 카테고리에는 운영자만 글을 작성할 수 있어요."
            );
        }
    }

    public List<PostDTO> getPosts(Long categoryId, String keyword, int limit, int offset, Long viewerUserId, boolean includeNotice) {
        try {
            List<PostDTO> list = postDAO.selectPosts(categoryId, keyword, limit, offset, viewerUserId, includeNotice);
            return list != null ? list : List.of();
        } catch (DataAccessException ex) {
            log.warn("getPosts: {}", ex.getMessage());
            return List.of();
        }
    }

    @Transactional
    public Long createPost(PostCreateRequestDTO dto, long userId, String roleCode) {
        assertCategoryWritableByUser(dto.getCategoryId(), roleCode);
        postDAO.insertPost(dto, userId);
        return dto.getPostId();
    }

    /**
     * 조회수 증가는 {@link PostViewIncrementService}에서 REQUIRES_NEW로 처리해,
     * 상위 readOnly 트랜잭션이 있어도 UPDATE가 거부되지 않도록 함.
     */
    public Map<String, Object> getPostDetailWithComments(Long postId, Long viewerUserId) {
        try {
            postViewIncrementService.incrementPostViewCount(postId);
        } catch (DataAccessException ex) {
            log.warn("incrementPostViewCount postId={}: {}", postId, ex.getMessage());
        }
        PostDTO post;
        List<CommentDTO> comments;
        try {
            post = postDAO.selectPostById(postId, viewerUserId);
            comments = commentDAO.selectCommentsByPost(postId, viewerUserId);
        } catch (DataAccessException ex) {
            log.warn("getPostDetailWithComments postId={}: {}", postId, ex.getMessage());
            post = null;
            comments = List.of();
        }

        Map<String, Object> res = new HashMap<>();
        res.put("post", post);
        res.put("comments", comments != null ? comments : List.of());
        return res;
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getComments(Long postId, Long viewerUserId) {
        try {
            List<CommentDTO> list = commentDAO.selectCommentsByPost(postId, viewerUserId);
            return list != null ? list : List.of();
        } catch (DataAccessException ex) {
            log.warn("getComments postId={}: {}", postId, ex.getMessage());
            return List.of();
        }
    }

    /**
     * 카테고리 이름에「고민」이 포함된 게시글 중 무작위 1건(추첨).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> drawRandomWorryPost(Long viewerUserId) {
        Long id;
        try {
            id = communitySpotlightDAO.selectRandomWorryPostId();
        } catch (DataAccessException ex) {
            log.warn("drawRandomWorryPost (select id): {}", ex.getMessage());
            id = null;
        }
        Map<String, Object> res = new HashMap<>();
        if (id == null) {
            res.put("post", null);
            res.put(
                    "message",
                    "추첨할 고민 글이 없어요. 카테고리 이름에「고민」이 들어간 카테고리에 올라온 글이 있으면 여기서 무작위로 골라요."
            );
            return res;
        }
        PostDTO post;
        try {
            post = postDAO.selectPostById(id, viewerUserId);
        } catch (DataAccessException ex) {
            log.warn("drawRandomWorryPost (load post): {}", ex.getMessage());
            post = null;
        }
        res.put("post", post);
        res.put("message", post == null ? "글을 찾을 수 없어요." : null);
        return res;
    }

    /**
     * 연말 인기봇: BOT_POPULARITY_STAT(stat_month=0) 우선, 없으면 BOT.like_count 기반.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getYearEndBotRanking(
            Integer yearIn,
            String viewerRoleCode,
            Collection<? extends GrantedAuthority> authorities
    ) {
        int currentYear = LocalDate.now().getYear();
        Integer maxYear;
        try {
            maxYear = communitySpotlightDAO.selectMaxStatYear();
        } catch (DataAccessException ex) {
            log.warn("getYearEndBotRanking selectMaxStatYear: {}", ex.getMessage());
            maxYear = null;
        }
        int year = yearIn != null ? yearIn : (maxYear != null ? maxYear : currentYear);

        List<BotYearRankingDTO> rows = List.of();
        String source = "BOT_POPULARITY_STAT";
        try {
            rows = communitySpotlightDAO.selectBotRankingForYear(year);
        } catch (DataAccessException ex) {
            log.warn("getYearEndBotRanking selectBotRankingForYear: {}", ex.getMessage());
            rows = List.of();
        }
        if (rows == null || rows.isEmpty()) {
            try {
                rows = communitySpotlightDAO.selectBotsByLikeCount(year);
            } catch (DataAccessException ex) {
                log.warn("getYearEndBotRanking selectBotsByLikeCount: {}", ex.getMessage());
                rows = List.of();
            }
            if (rows == null) {
                rows = List.of();
            }
            source = "BOT_LIKE_FALLBACK";
            int rank = 1;
            for (BotYearRankingDTO row : rows) {
                row.setRanking(rank++);
            }
        }

        boolean showAdminHint = isAdminForRankingHint(viewerRoleCode, authorities);
        Map<String, Object> res = new HashMap<>();
        res.put("year", year);
        res.put("entries", rows);
        String sourceDescription =
                "BOT_POPULARITY_STAT".equals(source)
                        ? "연간 집계(BOT_POPULARITY_STAT) 기준 순위예요."
                        : "연도별 집계가 없어 봇 좋아요 수로 순위를 보여 드려요. 연말에 BOT_POPULARITY_STAT을 채우면 자동으로 반영돼요.";
        if (!showAdminHint) {
            sourceDescription = "";
            res.put("source", null);
        } else {
            res.put("source", source);
        }
        res.put("sourceDescription", sourceDescription);
        return res;
    }

    private static Map<String, Object> postReactionBody(PostDTO refreshed) {
        Map<String, Object> body = new HashMap<>();
        body.put("liked", Boolean.TRUE.equals(refreshed.getLikedByMe()));
        body.put("likeCount", refreshed.getLikeCount());
        body.put("disliked", Boolean.TRUE.equals(refreshed.getDislikedByMe()));
        body.put("dislikeCount", refreshed.getDislikeCount());
        return body;
    }

    @Transactional
    public Map<String, Object> toggleBotRecommend(long botId, long userId) {
        int exists = botRecommendDAO.exists(userId, botId);
        boolean recommended;
        if (exists > 0) {
            botRecommendDAO.delete(userId, botId);
            botRecommendDAO.decrementBotLike(botId);
            recommended = false;
        } else {
            botRecommendDAO.insert(userId, botId);
            botRecommendDAO.incrementBotLike(botId);
            recommended = true;
        }
        Integer likeCount = botRecommendDAO.selectBotLikeCount(botId);
        Map<String, Object> res = new HashMap<>();
        res.put("botId", botId);
        res.put("recommended", recommended);
        res.put("likeCount", likeCount != null ? likeCount : 0);
        return res;
    }

    @Transactional
    public Map<String, Object> togglePostLike(long postId, long userId) {
        PostDTO post = postDAO.selectPostById(postId, null);
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없어요.");
        }
        if (Objects.equals(post.getUserId(), userId)) {
            Integer state = postDAO.selectPostReactionState(userId, postId);
            if (state != null) {
                postDAO.deletePostReaction(userId, postId);
                if (state == 1) {
                    postDAO.adjustPostLikeCount(postId, -1);
                } else {
                    postDAO.adjustPostDislikeCount(postId, -1);
                }
                return postReactionBody(postDAO.selectPostById(postId, userId));
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "본인이 작성한 글에는 좋아요를 누를 수 없어요.");
        }
        Integer state = postDAO.selectPostReactionState(userId, postId);
        if (state != null && state == 1) {
            postDAO.deletePostReaction(userId, postId);
            postDAO.adjustPostLikeCount(postId, -1);
        } else if (state != null && state == 0) {
            postDAO.upsertPostReaction(userId, postId, 1);
            postDAO.adjustPostDislikeCount(postId, -1);
            postDAO.adjustPostLikeCount(postId, 1);
        } else {
            postDAO.upsertPostReaction(userId, postId, 1);
            postDAO.adjustPostLikeCount(postId, 1);
        }
        return postReactionBody(postDAO.selectPostById(postId, userId));
    }

    /** 좋아요와 동시에 둘 수 없음(싫어요 켜면 좋아요 해제) */
    @Transactional
    public Map<String, Object> togglePostDislike(long postId, long userId) {
        PostDTO post = postDAO.selectPostById(postId, null);
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없어요.");
        }
        if (Objects.equals(post.getUserId(), userId)) {
            Integer state = postDAO.selectPostReactionState(userId, postId);
            if (state != null) {
                postDAO.deletePostReaction(userId, postId);
                if (state == 1) {
                    postDAO.adjustPostLikeCount(postId, -1);
                } else {
                    postDAO.adjustPostDislikeCount(postId, -1);
                }
                return postReactionBody(postDAO.selectPostById(postId, userId));
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "본인이 작성한 글에는 싫어요를 누를 수 없어요.");
        }
        Integer state = postDAO.selectPostReactionState(userId, postId);
        if (state != null && state == 0) {
            postDAO.deletePostReaction(userId, postId);
            postDAO.adjustPostDislikeCount(postId, -1);
        } else if (state != null && state == 1) {
            postDAO.upsertPostReaction(userId, postId, 0);
            postDAO.adjustPostLikeCount(postId, -1);
            postDAO.adjustPostDislikeCount(postId, 1);
        } else {
            postDAO.upsertPostReaction(userId, postId, 0);
            postDAO.adjustPostDislikeCount(postId, 1);
        }
        return postReactionBody(postDAO.selectPostById(postId, userId));
    }

    @Transactional
    public Map<String, Object> toggleCommentLike(long postId, long commentId, long userId) {
        if (commentDAO.countCommentOnPost(commentId, postId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없어요.");
        }
        CommentDTO commentRow = commentDAO.selectCommentById(commentId, null);
        if (commentRow != null && Objects.equals(commentRow.getUserId(), userId)) {
            if (commentDAO.deleteCommentLike(userId, commentId) > 0) {
                commentDAO.adjustCommentLikeCount(commentId, -1);
                CommentDTO refreshed = commentDAO.selectCommentById(commentId, userId);
                Map<String, Object> body = new HashMap<>();
                body.put("liked", Boolean.TRUE.equals(refreshed.getLikedByMe()));
                body.put("likeCount", refreshed.getLikeCount());
                return body;
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "본인이 작성한 댓글에는 좋아요를 누를 수 없어요.");
        }
        if (commentDAO.deleteCommentLike(userId, commentId) > 0) {
            commentDAO.adjustCommentLikeCount(commentId, -1);
        } else {
            commentDAO.insertCommentLike(userId, commentId);
            commentDAO.adjustCommentLikeCount(commentId, 1);
        }
        CommentDTO refreshed = commentDAO.selectCommentById(commentId, userId);
        Map<String, Object> body = new HashMap<>();
        body.put("liked", Boolean.TRUE.equals(refreshed.getLikedByMe()));
        body.put("likeCount", refreshed.getLikeCount());
        return body;
    }

    @Transactional
    public void createComment(Long postId, CommentCreateRequestDTO dto, long userId) {
        commentDAO.insertComment(dto, userId, postId);
    }

    @Transactional
    public void updatePost(Long postId, PostCreateRequestDTO dto, long userId, String roleCode) {
        assertCategoryWritableByUser(dto.getCategoryId(), roleCode);
        postDAO.updatePost(postId, dto, userId);
    }

    @Transactional
    public void deletePost(Long postId, long userId) {
        postDAO.deletePost(postId, userId);
    }

    @Transactional
    public void updateComment(Long commentId, CommentCreateRequestDTO dto, long userId) {
        commentDAO.updateComment(commentId, dto, userId);
    }

    @Transactional
    public void deleteComment(Long commentId, long userId) {
        commentDAO.deleteComment(commentId, userId);
    }
}

