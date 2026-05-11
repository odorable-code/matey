package kr.hi.matey.dao;

import kr.hi.matey.dto.BotYearRankingDTO;
import kr.hi.matey.dto.WorrySpotlightRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommunitySpotlightDAO {

    Long selectRandomWorryPostId();

    WorrySpotlightRow selectWorrySpotlightRow();

    int countWorryCategoryPostByPostId(@Param("postId") long postId);

    int upsertWorrySpotlight(
            @Param("postId") long postId,
            @Param("answerContent") String answerContent,
            @Param("userId") Long userId
    );

    List<BotYearRankingDTO> selectBotRankingForYear(@Param("year") int year);

    Integer selectMaxStatYear();

    List<BotYearRankingDTO> selectBotsByLikeCount(@Param("year") int year);

    /**
     * 월간 이벤트 집계가 비었을 때: BOT.like_count 로 순위 (봇 행만 있으면 목록 표시 가능).
     */
    List<BotYearRankingDTO> selectBotsByLikeCountMonthlyFallback(
            @Param("year") int year,
            @Param("month") int month
    );

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
