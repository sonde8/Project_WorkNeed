package com.Workneed.workneed.Board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCategoryDTO {
    private Long categoryId;    // 카테고리 고유 ID
    private String categoryName;
}
