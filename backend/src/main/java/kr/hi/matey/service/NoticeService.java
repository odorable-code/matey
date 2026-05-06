package kr.hi.matey.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import kr.hi.matey.dao.NoticeDAO;
import kr.hi.matey.dao.PostDAO;
import kr.hi.matey.dto.AdminNoticeDTO;
import kr.hi.matey.dto.NoticeFeedItemDTO;
import kr.hi.matey.dto.PostDTO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeService {
    private final NoticeDAO noticeDAO;
    private final PostDAO postDAO;

    public List<AdminNoticeDTO> getPublishedNotices() {
        try {
            return noticeDAO.selectPublishedNotices();
        } catch (DataAccessException ex) {
            // 프로젝트 DB 스키마에 ADMIN_NOTICE가 없는 환경에서도 커뮤니티 화면이 동작하도록
            return List.of();
        }
    }

    /**
     * 운영 공지(ADMIN_NOTICE)와 공지·이벤트 카테고리(notification=0) 게시글을 합쳐 최신순으로 반환합니다.
     */
    public List<NoticeFeedItemDTO> getNoticeFeed() {
        List<NoticeFeedItemDTO> items = new ArrayList<>();

        for (AdminNoticeDTO n : getPublishedNotices()) {
            NoticeFeedItemDTO row = new NoticeFeedItemDTO();
            row.setItemType("ADMIN_NOTICE");
            row.setNoticeId(n.getNoticeId());
            row.setBadge("공지");
            row.setTitle(n.getTitle());
            row.setContent(n.getContent());
            row.setPublishedAt(n.getPublishedAt() != null ? n.getPublishedAt() : n.getCreatedAt());
            items.add(row);
        }

        try {
            for (PostDTO p : postDAO.selectPostsForNoticeFeed()) {
                NoticeFeedItemDTO row = new NoticeFeedItemDTO();
                row.setItemType("POST");
                row.setPostId(p.getPostId());
                row.setBadge(p.getCategoryName() != null ? p.getCategoryName() : "공지");
                row.setTitle(p.getTitle());
                row.setContent(p.getContent());
                row.setPublishedAt(p.getCreatedAt());
                items.add(row);
            }
        } catch (DataAccessException ignored) {
            // 스키마 미구성 시 운영 공지만 노출
        }

        items.sort(Comparator.comparing(
                NoticeFeedItemDTO::getPublishedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    public void createNotice(AdminNoticeDTO dto) {
        noticeDAO.insertNotice(dto);
    }

    public void updateNotice(AdminNoticeDTO dto) {
        noticeDAO.updateNotice(dto);
    }
}

