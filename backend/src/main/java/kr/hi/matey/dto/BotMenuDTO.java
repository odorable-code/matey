
package kr.hi.matey.dto;
import lombok.Data;
import java.util.List;

@Data
public class BotMenuDTO {
    private int level;
    private int remainPoint;
    private int progressPercent;
    // 배경 및 모션 리스트는 단순화를 위해 Map 또는 별도 DTO List로 처리
    private List<BackgroundDTO> backgrounds;
    private List<MotionDTO> motions;

    @Data
    public static class BackgroundDTO {
        private String name;
        private String state; // 사용 중, 보유, 잠금
    }

    @Data
    public static class MotionDTO {
        private String name;
        private String tag; // NEW, 기본, 보유
    }
}
