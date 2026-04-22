package kr.hi.matey.domain;

import lombok.Data;

@Data
public class MemberDTO {
    private String id;
    private String pw;
    private String name;
    private int num;
    private String role;

    public MemberDTO(String id, String pw, String name, int num, String role) {
        this.id   = id;
        this.pw   = pw;
        this.name = name;
        this.num  = num;
        this.role = role;
    }
}
