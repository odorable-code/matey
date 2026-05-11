package kr.hi.matey.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface BotRecommendDAO {

    int exists(@Param("userId") long userId, @Param("botId") long botId);

    int insert(@Param("userId") long userId, @Param("botId") long botId);

    int delete(@Param("userId") long userId, @Param("botId") long botId);

    int incrementBotLike(@Param("botId") long botId);

    int decrementBotLike(@Param("botId") long botId);

    Integer selectBotLikeCount(@Param("botId") long botId);

    int insertRecommendEvent(
            @Param("userId") long userId,
            @Param("botId") long botId,
            @Param("delta") int delta
    );
}

