
package kr.hi.matey.dto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.util.Date;
import java.util.List;

// 2. 봇 상호작용 관련 DTO
@Data
public class BotMenuDTO {
    private int level;
    private int remainPoint;
    private int progressPercent;
    private List<BackgroundDTO> backgrounds;
    private List<MotionDTO> motions;

    /** 현재 대시보드에 쓰는 담당 봇 (USER.assigned_bot_id 기준, 없으면 첫 EXCLUSIVE) */
    private Long botId;
    private String botName;
    private String botAvatarImage;

    /** 담당 봇 선택 UI용 전체 봇 목록 */
    private List<AssignableBotOption> assignableBots;

    /** 오늘(Asia/Seoul 달력 기준) 먹이 보상을 이미 받았으면 true — UI에서 먹이 버튼 비활성화 */
    private Boolean feedDoneToday;

    @JsonIgnore
    private Date lastFeedRewardAt;

    @Data
    public static class BackgroundDTO {
        private Long backgroundId;
        private String name;
        /** 미리보기 정적 이미지 경로 */
        private String imageUrl;
        private String state; // 보유, 잠금
    }

    @Data
    public static class MotionDTO {
        private String motionCode;
        private String name;
        private String tag; // 기본, 보유, 잠금
        /** 대시보드 등 정적 에셋 경로 */
        private String assetUrl;
        /** 잠금 시 UI에 표시할 해제 필요 친밀도 단계 */
        private Integer unlockIntimacyLevel;
    }
}
