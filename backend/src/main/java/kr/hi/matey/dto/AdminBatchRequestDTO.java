package kr.hi.matey.dto;

import lombok.Data;
import java.util.List;

@Data
public class AdminBatchRequestDTO {
    private List<Long> userIds;
    private String status;
    private String roleCode;
}
