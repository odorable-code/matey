package kr.hi.matey.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.dto.ReportDTO;
import kr.hi.matey.dto.ReportReasonDTO;

@Mapper
public interface ReportDAO {

    int insertReport(ReportDTO reportDTO);

    int insertReportImage(
        @Param("supportId") Long supportId,
        @Param("imageUrl") String imageUrl
    );

    int existsReason(Integer reason);

    List<ReportReasonDTO> selectReasonList();
}