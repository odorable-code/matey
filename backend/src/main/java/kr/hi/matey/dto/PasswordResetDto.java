package kr.hi.matey.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PasswordResetDto {

	String token;
	String newpassword;
}
