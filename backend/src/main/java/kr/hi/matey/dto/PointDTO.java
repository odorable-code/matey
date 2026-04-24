package kr.hi.matey.dto;

import lombok.Data;

@Data
public class PointDTO {
    private String id;
    private String title;
    private int amount;
    private String type;
    private String date;
}