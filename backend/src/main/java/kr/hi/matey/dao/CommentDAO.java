package kr.hi.matey.dao;

import kr.hi.matey.dto.CommentCreateRequestDTO;
import kr.hi.matey.dto.CommentDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentDAO {
    List<CommentDTO> selectCommentsByPost(@Param("postId") Long postId);

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
}

