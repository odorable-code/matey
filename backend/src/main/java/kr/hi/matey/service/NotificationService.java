package kr.hi.matey.service;

import kr.hi.matey.dao.NotificationDAO;
import kr.hi.matey.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationDAO notificationDAO;
    private final NotificationEmailService notificationEmailService;

    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotifications(Long userId) {
        return notificationDAO.selectNotifications(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        notificationDAO.updateReadStatus(userId, notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationDAO.updateAllReadStatus(userId);
    }

    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        notificationDAO.deleteNotification(userId, notificationId);
    }

    @Transactional
    public void createNotification(Long userId, String typeCode, String content,
                                   String targetType, Long targetId) {
        notificationDAO.insertNotification(userId, typeCode, content, targetType, targetId);
        notificationEmailService.sendIfEnabled(userId, typeCode, content);
    }

    /**
     * 답변 최초 등록은 새 알림 행을 추가하고, 관리자가 답변을 수정한 경우에는
     * 동일 티켓의 기존 SUPPORT_ANSWER 알림을 갱신해 중복 알림을 줄입니다.
     */
    @Transactional
    public void notifySupportAnswer(Long ticketOwnerId, Long supportId, String content, boolean isUpdate) {
        if (isUpdate) {
            Long existingId = notificationDAO.selectLatestSupportAnswerNotificationId(ticketOwnerId, supportId);
            if (existingId != null) {
                notificationDAO.updateSupportAnswerNotification(ticketOwnerId, existingId, content);
                notificationEmailService.sendIfEnabled(ticketOwnerId, "SUPPORT_ANSWER", content);
                return;
            }
        }
        createNotification(ticketOwnerId, "SUPPORT_ANSWER", content, "SUPPORT", supportId);
    }

    @Transactional
    public void markSupportInboxRelatedRead(Long userId) {
        notificationDAO.markReadSupportInboxRelated(userId);
    }

    @Transactional
    public void markReadForPostRelated(Long userId, Long postId) {
        if (userId == null || postId == null) {
            return;
        }
        notificationDAO.markReadForPostRelated(userId, postId);
    }
}
