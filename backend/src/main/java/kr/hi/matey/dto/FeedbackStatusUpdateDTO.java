package kr.hi.matey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "피드백 상태 변경 DTO")
public class FeedbackStatusUpdateDTO {
    
    @Schema(description = "상태 (PENDING, REVIEW, RESOLVED)")
    private String status;
    
    @Schema(description = "메모")
    private String memo;
}