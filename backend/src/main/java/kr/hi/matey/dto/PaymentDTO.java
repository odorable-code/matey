package kr.hi.matey.dto;

import lombok.Data;

@Data
public class PaymentDTO {
    private long userId;
    private String title;
    private int amount;
    private String date;
    private String method;
    private String status;
}