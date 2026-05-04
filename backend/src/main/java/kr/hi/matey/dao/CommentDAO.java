package kr.hi.matey.dao;

import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.CommentDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentDAO {
    List<CommentDTO> selectCommentsByPost(
            @Param("postId") Long postId,
            @Param("viewerUserId") Long viewerUserId
    );

    int countCommentOnPost(@Param("commentId") long commentId, @Param("postId") long postId);

    CommentDTO selectCommentById(
            @Param("commentId") long commentId,
            @Param("viewerUserId") Long viewerUserId
    );

    int insertComment(
            @Param("dto") CommentCreateRequestDTO dto,
            @Param("userId") Long userId,
            @Param("postId") Long postId
    );

    int updateComment(
            @Param("commentId") Long commentId,
            @Param("dto") CommentCreateRequestDTO dto,
            @Param("userId") Long userId
    );

    int deleteComment(@Param("commentId") Long commentId, @Param("userId") Long userId);

    int insertCommentLike(@Param("userId") long userId, @Param("commentId") long commentId);

    int deleteCommentLike(@Param("userId") long userId, @Param("commentId") long commentId);

    int adjustCommentLikeCount(@Param("commentId") long commentId, @Param("delta") int delta);
}

