package kr.hi.matey.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetDTO {
	private String email;
    private LocalDateTime expiresAt;
    @JsonProperty("token")
    private String tokenHash;
    private String newPassword;
    private LocalDateTime usedAt;
    private LocalDateTime createdAt;
    
}
