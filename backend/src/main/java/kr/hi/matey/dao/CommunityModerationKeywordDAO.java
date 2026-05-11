package kr.hi.matey.dao;

import kr.hi.matey.dto.ModerationKeywordDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommunityModerationKeywordDAO {

    List<ModerationKeywordDTO> selectEnabledKeywords();

    int incrementHit(@Param("keywordId") long keywordId);
}
