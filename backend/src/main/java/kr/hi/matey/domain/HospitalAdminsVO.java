package kr.hi.matey.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class HospitalAdminsVO {

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
	int hoNum;
	//병원 이름
	String hospitalName;
	String role; 
}
