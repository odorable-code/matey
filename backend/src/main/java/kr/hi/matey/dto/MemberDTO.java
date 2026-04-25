package kr.hi.matey.dto;

import lombok.Data;

@Data
public class MemberDTO {
    private long id;
    private String pw;
    private String name;
    private int num;
    private String role;
}
