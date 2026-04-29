package kr.hi.matey.dao;


import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportReasonDTO;
import kr.hi.matey.dto.SupportDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SupportDAO {
    List<SupportDTO> selectSupportList(Long userId);

    int insertSupportTicket(SupportDTO supportDTO);

    // 사용자 문의 분류(문의/신고 유형 선택용)
    List<SupportReasonDTO> selectSupportReasons();

    List<FaqDTO> selectFaqList();

    // 관리자 FAQ 관리
    int insertFaq(FaqDTO faqDTO);
    int updateFaq(FaqDTO faqDTO);
    FaqDTO selectFaqById(Long faqId);
}