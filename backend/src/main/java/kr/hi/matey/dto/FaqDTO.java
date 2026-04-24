package kr.hi.matey.dto;


import lombok.Data;

import java.math.BigInteger;

@Data
public class FaqDTO {
    private long userId;
    private String question;
    private String answer;
}