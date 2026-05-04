package kr.hi.matey.dao;

import kr.hi.matey.dto.AdminNoticeDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface NoticeDAO {
    List<AdminNoticeDTO> selectPublishedNotices();
    int insertNotice(AdminNoticeDTO dto);
    int updateNotice(AdminNoticeDTO dto);
}

