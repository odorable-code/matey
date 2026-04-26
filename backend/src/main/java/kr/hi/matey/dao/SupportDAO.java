package kr.hi.matey.dao;


import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SupportDAO {
    List<SupportDTO> selectSupportList(long userId);
    void insertSupportTicket(SupportDTO supportDTO);
    List<FaqDTO> selectFaqList();
}