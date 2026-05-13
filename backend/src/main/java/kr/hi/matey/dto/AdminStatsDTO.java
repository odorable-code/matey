package kr.hi.matey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "관리자 통계 DTO")
public class AdminStatsDTO {

    @Schema(description = "전체 사용자 수")
    private Long totalUsers;

    @Schema(description = "활성 사용자 수")
    private Long activeUsers;

    @Schema(description = "정지된 사용자 수")
    private Long suspendedUsers;

    @Schema(description = "관리자 수")
    private Long adminUsers;

    @Schema(description = "슈퍼 관리자 수")
    private Long superAdminUsers;

    @Schema(description = "총 상담 수")
    private Long totalConversations;

    @Schema(description = "총 리포트 수")
    private Long totalReports;

    @Schema(description = "평균 참여율")
    private Integer avgAttendance;

    @Schema(description = "대기 중인 피드백 수")
    private Long pendingFeedbacks;

    @Schema(description = "검토 중인 피드백 수")
    private Long reviewFeedbacks;

    @Schema(description = "해결된 피드백 수")
    private Long resolvedFeedbacks;
}