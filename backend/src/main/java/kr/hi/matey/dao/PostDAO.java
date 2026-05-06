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

    List<PostDTO> selectPosts(
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset,
            @Param("viewerUserId") Long viewerUserId
    );

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

    int insertPostLike(@Param("userId") long userId, @Param("postId") long postId);

    int deletePostLike(@Param("userId") long userId, @Param("postId") long postId);

    int adjustPostLikeCount(@Param("postId") long postId, @Param("delta") int delta);
}

