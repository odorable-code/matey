package kr.hi.matey.dto;

import lombok.Data;

@Data
public class CategoryDTO {
    private Long categoryId;
    private String name;
    private Integer displayOrder;
}

