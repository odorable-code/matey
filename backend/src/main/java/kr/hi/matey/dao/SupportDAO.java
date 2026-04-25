package kr.hi.matey.dao;


import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SupportDAO {
    List<SupportDTO> selectSupportList(long userId);
    void insertSupportTicket(SupportDTO supportDTO);
    List<FaqDTO> selectFaqList();
}