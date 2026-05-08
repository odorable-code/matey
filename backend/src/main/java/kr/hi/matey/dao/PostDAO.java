package kr.hi.matey.dao;

import kr.hi.matey.dto.CategoryDTO;
import kr.hi.matey.dto.PostCreateRequestDTO;
import kr.hi.matey.dto.PostDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PostDAO {
    List<CategoryDTO> selectCategories();

    Integer selectCategoryNotification(@Param("categoryId") Long categoryId);

    String selectCategoryName(@Param("categoryId") Long categoryId);

    List<PostDTO> selectPosts(
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset,
            @Param("viewerUserId") Long viewerUserId,
            @Param("includeNotice") boolean includeNotice
    );

    /** 공지 페이지용: notification=0 카테고리(공지·이벤트) 게시글만, 최신순 */
    List<PostDTO> selectPostsForNoticeFeed();

    PostDTO selectPostById(
            @Param("postId") Long postId,
            @Param("viewerUserId") Long viewerUserId
    );

    int incrementPostViewCount(@Param("postId") Long postId);

    int insertPost(@Param("dto") PostCreateRequestDTO dto, @Param("userId") Long userId);

    int updatePost(
            @Param("postId") Long postId,
            @Param("dto") PostCreateRequestDTO dto,
            @Param("userId") Long userId
    );

    int deletePost(@Param("postId") Long postId, @Param("userId") Long userId);

    /**
     * 사용자별 게시글 반응 상태 조회.
     * - 1: 좋아요, 0: 싫어요, null: 반응 없음
     */
    Integer selectPostReactionState(@Param("userId") long userId, @Param("postId") long postId);

    /** 반응 저장(없으면 생성, 있으면 state 갱신) */
    int upsertPostReaction(@Param("userId") long userId, @Param("postId") long postId, @Param("state") int state);

    /** 반응 삭제(좋아요/싫어요 모두 해제) */
    int deletePostReaction(@Param("userId") long userId, @Param("postId") long postId);

    int adjustPostLikeCount(@Param("postId") long postId, @Param("delta") int delta);

    int adjustPostDislikeCount(@Param("postId") long postId, @Param("delta") int delta);
}

