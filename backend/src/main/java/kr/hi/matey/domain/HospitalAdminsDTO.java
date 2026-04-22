package kr.hi.matey.domain;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class HospitalAdminsDTO {
    int adminNum;
    String adminId;
    String adminPw;
    String adminName;
    String adminAddr;
    String adminEmail;
    String adminPhone;
    String businessNum;
    boolean adminTermsAgreed;
    boolean adminLocationAgreed;
    boolean adminAlert;
    LocalDateTime adminCreatedAt;
    LocalDateTime adminUpdatedAt;
    int hoNum;
    String hoName;
}
