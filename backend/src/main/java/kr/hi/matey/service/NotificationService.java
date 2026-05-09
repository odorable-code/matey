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
}
