package kr.hi.matey.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommentModerationBlockLogDAO {

    int insert(
            @Param("userId") long userId,
            @Param("postId") long postId,
            @Param("matchedPhrase") String matchedPhrase,
            @Param("contentSnippet") String contentSnippet
    );
}
