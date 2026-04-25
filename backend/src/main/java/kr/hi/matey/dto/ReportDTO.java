package kr.hi.matey.dto;

import kr.hi.matey.util.SupportTargetType;
import kr.hi.matey.util.SupportType;
import lombok.Data;

@Data
public class ReportDTO {

    private Long supportId;

    private SupportType type;
    private SupportTargetType targetType;

    private Long targetId;
    private Integer reason;
    private String content;

    private Long userId;
}