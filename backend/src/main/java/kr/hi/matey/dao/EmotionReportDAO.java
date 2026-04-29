package kr.hi.matey.dao;

import kr.hi.matey.dto.EmotionReportDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface EmotionReportDAO {
    // Dashboard (대시보드 통계용 읽기)
    List<Map<String, Object>> selectDailyEmotionStats(@Param("userId") Long userId);
    List<Map<String, Object>> selectBotHistoryStats(@Param("userId") Long userId);

    // CRUD
    void insertEmotionReport(EmotionReportDTO dto);
    List<EmotionReportDTO> selectEmotionReportList(@Param("userId") Long userId);
    EmotionReportDTO selectEmotionReportById(@Param("analysisId") Long analysisId);
    void updateEmotionReport(EmotionReportDTO dto);
    void deleteEmotionReport(@Param("analysisId") Long analysisId);
}
