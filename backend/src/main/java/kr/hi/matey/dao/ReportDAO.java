package kr.hi.matey.dao;


import kr.hi.matey.dto.ReportDTO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ReportDAO {
    ReportDTO selectLatestReportByUserId(long userId);
    ReportDTO selectReportById(long reportId);
}