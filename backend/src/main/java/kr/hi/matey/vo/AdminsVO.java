package kr.hi.matey.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AdminsVO {

	int adminNum;
	String adminId;
	String adminPw;
	String adminName;
	String adminAddr;
	String adminEmail;
	String adminPhone;
	String businessNum;
	int adminTermsAgreed;
	int adminLocationAgreed;
	int adminAlert;
	String adminCreatedAt;
	String adminUpdatedAt;
	//병원 이름
	String role;
}
