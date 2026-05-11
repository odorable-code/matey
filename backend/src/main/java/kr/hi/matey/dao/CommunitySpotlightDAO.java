package kr.hi.matey.dao;

import kr.hi.matey.dto.BotYearRankingDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommunitySpotlightDAO {

    Long selectRandomWorryPostId();

    List<BotYearRankingDTO> selectBotRankingForYear(@Param("year") int year);

    Integer selectMaxStatYear();

    List<BotYearRankingDTO> selectBotsByLikeCount(@Param("year") int year);

    /**
     * BOT_RECOMMEND_EVENT 기준: 해당 연·월에 발생한 추천 합산(net) 상위 봇.
     */
    List<BotYearRankingDTO> selectBotRankingForCalendarMonth(
            @Param("year") int year,
            @Param("month") int month
    );

    /** 카테고리 이름에「사연」이 포함된 게시글 중 무작위 1건 */
    Long selectRandomStoryPostId();
}
