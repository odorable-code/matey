package kr.hi.matey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "로그 필터 DTO")
public class LogFilterDTO {
    
    @Schema(description = "검색 키워드")
    private String keyword;
    
    @Schema(description = "카테고리 필터")
    private String category;
    
    @Schema(description = "행위자 필터")
    private String actor;
    
    @Schema(description = "기간 (ALL, TODAY, WEEK)")
    private String period;
}