package kr.hi.matey.dto;

import lombok.Data;

@Data
public class UserEmailDTO {
    private String email;
    private boolean marketingNotice;  // USER.is_marketing_agreed
}
