package kr.hi.matey.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PasswordResetDTO {
	private String email;
    private String userName;
    private LocalDateTime expiresAt;
    private String tokenHash;
    private String newPassword;
}
