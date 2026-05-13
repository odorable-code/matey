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
        // 사용자가 해당 알림 타입을 꺼놓았으면 알림을 생성하지 않음
        if (!notificationDAO.selectIsTypeEnabled(userId, typeCode)) {
            return;
        }
        notificationDAO.insertNotification(userId, typeCode, content, targetType, targetId);
        notificationEmailService.sendIfEnabled(userId, typeCode, content);
    }

    /** 안 읽은 알림 수 조회 (헤더 뱃지용) */
    @Transactional(readOnly = true)
    public int getUnreadCount(Long userId) {
        return notificationDAO.selectUnreadCount(userId);
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

    /**
     * 관리자가 이메일로 알림을 전송합니다.
     * 관리자 발송이므로 사용자 개별 타입 설정 검사를 건너뜁니다.
     */
    @Transactional
    public void sendNotificationByEmail(String email, String typeCode, String content) {
        Long userId = notificationDAO.selectUserIdByEmail(email);
        if (userId == null) {
            throw new IllegalArgumentException("해당 이메일의 사용자를 찾을 수 없습니다: " + email);
        }
        notificationDAO.insertNotification(userId, typeCode, content, null, null);
        notificationEmailService.sendIfEnabled(userId, typeCode, content);
    }
}
