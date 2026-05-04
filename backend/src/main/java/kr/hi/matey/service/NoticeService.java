package kr.hi.matey.service;

import kr.hi.matey.dao.NoticeDAO;
import kr.hi.matey.dto.AdminNoticeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {
    private final NoticeDAO noticeDAO;

    public List<AdminNoticeDTO> getPublishedNotices() {
        try {
            return noticeDAO.selectPublishedNotices();
        } catch (DataAccessException ex) {
            // 프로젝트 DB 스키마에 ADMIN_NOTICE가 없는 환경에서도 커뮤니티 화면이 동작하도록
            return List.of();
        }
    }

    public void createNotice(AdminNoticeDTO dto) {
        noticeDAO.insertNotice(dto);
    }

    public void updateNotice(AdminNoticeDTO dto) {
        noticeDAO.updateNotice(dto);
    }
}

