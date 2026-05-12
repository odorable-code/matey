package kr.hi.matey.dto;

import lombok.Data;

/**
 * 담당 봇 선택·랜딩 노출용 BOT 한 행 (MyBatis resultType 에 내부 클래스 {@code $} 를 쓰지 않기 위해 최상위 DTO 로 분리)
 */
@Data
public class AssignableBotOption {
    private Long botId;
    /** 내부 식별자 (dog, bear, …) — 채팅·URL 키 */
    private String name;
    /** 화면·관리자 표기 (강이, 곰이, …) */
    private String displayName;
    private String avatarImage;
    /** 메인 카드 4막대 JSON: [{"label":"공감력","value":92}, …] */
    private String cardStatsJson;
}
