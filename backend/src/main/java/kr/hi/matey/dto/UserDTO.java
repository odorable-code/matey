package kr.hi.matey.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
	
	@Schema(description = "사용자 고유 번호 (PK)")
    private String userId;
    @Schema(description = "사용자의 비밀번호")
    String password;
    @Schema(description = "사용자의 이름")
    String name;
    @Schema(description = "사용자의 이름")
    String nickname;
    @Schema(description = "사용자의 주소")
    String addr;
    @Schema(description = "사용자의 이메일")
    String email;
    @Schema(description = "사용자의 전화번호")
    String phone;
    @Schema(description = "사용자의 생년월일")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    LocalDate birth;
    @Schema(description = "사용자의 성별")
    String gender;
    @Schema(description = "알림 허용 여부")
    boolean alert;
    @Schema(description = "서비스이용약관 동의 여부")
    boolean termsAgreed;
    @Schema(description = "위치기반 서비스 동의 여부")
    boolean locationAgreed;
    @Schema(description = "역할")
    String role;
   
    
//    public UserDTO(int userId, String password, String name, String nickname, String addr,
//    			   String email, String phone, LocalDate birth, String gender, boolean alert,
//    			   boolean termsAgreed, boolean locationAgreed, String role) {
//    	
//    	this.userId = userId;
//    	this.password = password;
//    	this.name = name;
//    	this.nickname = nickname;
//    	this.addr = addr;
//    	this.email = email;
//    	this.phone = phone;
//    	this.birth = birth;
//    	this.gender = gender;
//    	this.alert = alert;
//    	this.termsAgreed = termsAgreed;
//    	this.locationAgreed = locationAgreed;
//    	this.role = role;
//    }
}
