package kr.hi.matey.dto;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
	
	private Long userId;
    private String email;
    private String password;
    private String nickname;
    private String userName;
    private Long userBirth;
    private Long gender;
    private String profileImage;
    private String role;
    private String loginType;
    private String status;
    private Integer point;
    private String subscriptionGrade;
    private Boolean isAdult;
    private Boolean isNotiAgree;
    private Boolean isTermsAgreed;
    private Boolean isPrivacyAgreed;
    private Boolean isMarketingAgreed;
    private Timestamp lastLoginAt;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private LocalDateTime tokenExpiryDate;
    private String resetToken;
    private boolean rememberMe;
   
    
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
