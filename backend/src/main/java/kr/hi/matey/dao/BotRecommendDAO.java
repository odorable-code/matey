package kr.hi.matey.dao;

import kr.hi.matey.dto.UserBotReactionRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BotRecommendDAO {

    /** 없으면 null, 1=좋아요, 0=싫어요 */
    Integer selectReaction(@Param("userId") long userId, @Param("botId") long botId);

    List<UserBotReactionRow> selectReactionsByUser(@Param("userId") long userId);

    int insertWithReaction(
            @Param("userId") long userId,
            @Param("botId") long botId,
            @Param("reaction") int reaction
    );

    int incrementBotLike(@Param("botId") long botId);

    int decrementBotLike(@Param("botId") long botId);

    int incrementBotDislike(@Param("botId") long botId);

    int decrementBotDislike(@Param("botId") long botId);

    Integer selectBotLikeCount(@Param("botId") long botId);

    Integer selectBotDislikeCount(@Param("botId") long botId);

    int insertRecommendEvent(
            @Param("userId") long userId,
            @Param("botId") long botId,
            @Param("delta") int delta
    );
}

