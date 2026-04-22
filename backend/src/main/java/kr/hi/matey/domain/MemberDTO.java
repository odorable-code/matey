package kr.hi.matey.domain;

import lombok.Data;

@Data
public class MemberDTO {
    private String id;
    private String pw;
    private String name;
    private int num;
    private String role;
    private int hoNum; // ✅ 병원 관리자용 추가

    // 환자용 생성자 (기존)
    public MemberDTO(String id, String pw, String name, int num, String role) {
        this.id   = id;
        this.pw   = pw;
        this.name = name;
        this.num  = num;
        this.role = role;
    }

    // 병원 관리자용 생성자 ✅ 추가
    public MemberDTO(String id, String pw, String name, int num, String role, int hoNum) {
        this.id    = id;
        this.pw    = pw;
        this.name  = name;
        this.num   = num;
        this.role  = role;
        this.hoNum = hoNum;
    }
}
