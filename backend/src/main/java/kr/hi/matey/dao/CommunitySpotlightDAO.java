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
}
