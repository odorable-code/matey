package kr.hi.matey.dao;

import kr.hi.matey.dto.NotificationDTO;
import kr.hi.matey.dto.UserEmailDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationDAO {
    List<NotificationDTO> selectNotifications(Long userId);
    int updateReadStatus(@Param("userId") Long userId, @Param("notificationId") Long notificationId);
    int updateAllReadStatus(Long userId);
    int deleteNotification(@Param("userId") Long userId, @Param("notificationId") Long notificationId);

    int insertNotification(@Param("userId") Long userId, @Param("typeCode") String typeCode,
                           @Param("content") String content, @Param("targetType") String targetType,
                           @Param("targetId") Long targetId);

    Long selectLatestSupportAnswerNotificationId(@Param("userId") Long userId,
                                                 @Param("supportId") Long supportId);

    int updateSupportAnswerNotification(@Param("userId") Long userId,
                                        @Param("notificationId") Long notificationId,
                                        @Param("content") String content);

    int markReadSupportInboxRelated(@Param("userId") Long userId);

    int markReadForPostRelated(@Param("userId") Long userId, @Param("postId") Long postId);

    UserEmailDTO selectUserEmail(@Param("userId") Long userId);

    /** 해당 사용자가 특정 알림 타입을 활성화했는지 확인 (행이 없으면 기본 true) */
    boolean selectIsTypeEnabled(@Param("userId") Long userId, @Param("typeCode") String typeCode);

    /** 안 읽은 알림 수 조회 (뱃지용 경량 API) */
    int selectUnreadCount(@Param("userId") Long userId);

    /** 이메일로 user_id 조회 (관리자 알림 전송용) */
    Long selectUserIdByEmail(@Param("email") String email);
}
