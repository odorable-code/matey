package kr.hi.matey.service;

import kr.hi.matey.dao.NoticeDAO;
import kr.hi.matey.dto.AdminNoticeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {
    private final NoticeDAO noticeDAO;

    public List<AdminNoticeDTO> getPublishedNotices() {
        return noticeDAO.selectPublishedNotices();
    }

    public void createNotice(AdminNoticeDTO dto) {
        noticeDAO.insertNotice(dto);
    }

    public void updateNotice(AdminNoticeDTO dto) {
        noticeDAO.updateNotice(dto);
    }
}

