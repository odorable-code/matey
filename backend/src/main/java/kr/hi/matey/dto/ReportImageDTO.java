package kr.hi.matey.dto;

import lombok.Data;

@Data
public class ReportImageDTO {

    private Long supportImageId;
    private String imageUrl;
    private Long supportId;
}