package kr.hi.matey.dao;


import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportReasonDTO;
import kr.hi.matey.dto.SupportDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SupportDAO {
    List<SupportDTO> selectSupportList(@Param("userId") Long userId);

    int insertSupportTicket(SupportDTO supportDTO);

    // 사용자 문의 분류(문의/신고 유형 선택용)
    List<SupportReasonDTO> selectSupportReasons();

    SupportReasonDTO selectSupportReasonById(@Param("supportReasonId") Long supportReasonId);

    int countExistingReportForTarget(
            @Param("userId") Long userId,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId
    );

    int deleteAnswersForOwnedSupport(@Param("supportId") Long supportId, @Param("userId") Long userId);

    int deleteSupportIfOwner(@Param("supportId") Long supportId, @Param("userId") Long userId);

    List<FaqDTO> selectFaqList();

    // 관리자 FAQ 관리
    int insertFaq(FaqDTO faqDTO);
    int updateFaq(FaqDTO faqDTO);
    FaqDTO selectFaqById(@Param("faqId") Long faqId);
}