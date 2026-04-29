
package kr.hi.matey.dto;
import lombok.Data;
import java.util.List;

// 2. 봇 상호작용 관련 DTO
@Data
public class BotMenuDTO {
    private int level;
    private int remainPoint;
    private int progressPercent;
    private List<BackgroundDTO> backgrounds;
    private List<MotionDTO> motions;

    @Data
    public static class BackgroundDTO {
        private String name;
        private String state; // 보유, 잠금
    }

    @Data
    public static class MotionDTO {
        private String name;
        private String tag; // 기본, 보유, 잠금
    }
}