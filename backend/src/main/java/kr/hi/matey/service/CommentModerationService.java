package kr.hi.matey.service;

import kr.hi.matey.dao.CommentModerationBlockLogDAO;
import kr.hi.matey.dao.CommunityModerationKeywordDAO;
import kr.hi.matey.dto.ModerationKeywordDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentModerationService {

    private final CommunityModerationKeywordDAO moderationKeywordDAO;
    private final CommentModerationBlockLogDAO commentModerationBlockLogDAO;

    private static String snippet(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.replace('\n', ' ').trim();
        return t.length() > 200 ? t.substring(0, 200) : t;
    }

    @Transactional
    public void assertCommentAllowed(String content, long userId, long postId) {
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용을 입력해 주세요.");
        }
        List<ModerationKeywordDTO> keywords;
        try {
            keywords = moderationKeywordDAO.selectEnabledKeywords();
        } catch (DataAccessException ex) {
            log.warn("moderation keywords load failed (skip auto-block): {}", ex.getMessage());
            return;
        }
        if (keywords == null || keywords.isEmpty()) {
            return;
        }
        String normalized = content.toLowerCase(Locale.ROOT);
        for (ModerationKeywordDTO k : keywords) {
            if (k == null || k.getPhrase() == null || k.getPhrase().isBlank()) {
                continue;
            }
            String p = k.getPhrase().trim().toLowerCase(Locale.ROOT);
            if (p.isEmpty()) {
                continue;
            }
            if (normalized.contains(p)) {
                try {
                    if (k.getKeywordId() != null) {
                        moderationKeywordDAO.incrementHit(k.getKeywordId());
                    }
                } catch (DataAccessException ex) {
                    log.warn("increment moderation hit: {}", ex.getMessage());
                }
                try {
                    commentModerationBlockLogDAO.insert(
                            userId,
                            postId,
                            k.getPhrase().trim(),
                            snippet(content)
                    );
                } catch (DataAccessException ex) {
                    log.warn("moderation block log: {}", ex.getMessage());
                }
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "부적절한 표현이 포함되어 있어 댓글을 등록할 수 없어요."
                );
            }
        }
    }
}
