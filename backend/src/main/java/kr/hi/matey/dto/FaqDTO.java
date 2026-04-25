package kr.hi.matey.dto;


import lombok.Data;


@Data
public class FaqDTO {
    private long userId;
    private String question;
    private String answer;
}