package kr.hi.matey.dto;

import lombok.Data;

@Data
public class SupportReasonDTO {
    private Long supportReasonId;
    private String targetType;
    private String reasonName;
    private Boolean isActive;
}

