package kr.hi.matey.service;

import kr.hi.matey.dao.NotificationDAO;
import kr.hi.matey.dto.UserEmailDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEmailService {

    private final JavaMailSender mailSender;
    private final NotificationDAO notificationDAO;

    private static final Map<String, String> TYPE_TITLES = Map.of(
        "SUPPORT_ANSWER", "신고/문의 답변이 등록되었습니다",
        "POST_COMMENT",   "새 댓글이 달렸습니다",
        "COMMENT_REPLY",  "대댓글이 달렸습니다",
        "BOT_MESSAGE",    "메이티의 새 쪽지가 도착했습니다",
        "SYSTEM_NOTICE",  "공지사항이 있습니다",
        "POINT_REWARD",   "포인트가 지급되었습니다",
        "COMMUNITY_HOT",  "내 글이 인기글이 되었습니다",
        "REPORT_RESULT",  "신고 처리 결과가 나왔습니다",
        "CHAT_REMINDER",  "메이트가 기다리고 있어요",
        "EVENT_NOTICE",   "새로운 이벤트가 시작되었습니다"
    );

    public void sendIfEnabled(Long userId, String typeCode, String content) {
        try {
            UserEmailDTO user = notificationDAO.selectUserEmail(userId);
            if (user == null || !user.isMarketingNotice()) return;

            String title = TYPE_TITLES.getOrDefault(typeCode, "새로운 알림이 있습니다");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("[Matey] " + title);
            message.setText(content != null ? content : title);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("알림 이메일 발송 실패: userId={}, typeCode={}", userId, typeCode, e);
        }
    }
}
