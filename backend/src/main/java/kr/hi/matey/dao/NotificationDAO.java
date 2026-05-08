package kr.hi.matey.dao;

import kr.hi.matey.dto.NotificationDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationDAO {
    List<NotificationDTO> selectNotifications(Long userId);
    int updateReadStatus(@Param("userId") Long userId, @Param("notificationId") Long notificationId);
    int updateAllReadStatus(Long userId);
    int deleteNotification(@Param("userId") Long userId, @Param("notificationId") Long notificationId);
}
