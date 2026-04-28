package kr.hi.matey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "관리자 사용자 수정 DTO")
public class UserUpdateDTO {
    
    @Schema(description = "닉네임")
    private String nickname;
    
    @Schema(description = "상태 (ACTIVE, SUSPENDED, DELETED)")
    private String status;
    
    @Schema(description = "역할 (USER, ADMIN, SUPER_ADMIN)")
    private String role;
    
    @Schema(description = "전화번호")
    private String phone;
    
    @Schema(description = "태그 목록")
    private String[] tags;
}