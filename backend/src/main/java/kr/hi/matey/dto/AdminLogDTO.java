package kr.hi.matey.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "관리자 활동 로그 DTO")
public class AdminLogDTO {
    
    @Schema(description = "로그 고유 번호")
    private Long id;
    
    @Schema(description = "행위자 (관리자)")
    private String actor;
    
    @Schema(description = "행위자 역할")
    private String actorRole;
    
    @Schema(description = "카테고리")
    private String category;
    
    @Schema(description = "액션")
    private String action;
    
    @Schema(description = "대상")
    private String target;
    
    @Schema(description = "상세 내용")
    private String detail;
    
    @Schema(description = "태그 목록")
    private String[] tags;
    
    @Schema(description = "생성 일시")
    private LocalDateTime createdAt;
}