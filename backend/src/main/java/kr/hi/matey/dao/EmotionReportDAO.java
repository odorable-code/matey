package kr.hi.matey.dao;


import kr.hi.matey.dto.EmotionReportDTO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmotionReportDAO {
    EmotionReportDTO selectLatestReportByUserId(long userId);
    EmotionReportDTO selectReportById(long reportId);
}