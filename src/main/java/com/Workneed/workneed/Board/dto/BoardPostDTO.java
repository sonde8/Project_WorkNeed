package com.Workneed.workneed.Board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardPostDTO {
    private Long postId;              // 게시글 고유 ID
    private Long categoryId;          // 연결된 카테고리 ID
    private Long writerId;            // 작성자 사용자 ID
    private String title;             // 게시물 제목
    private String content;           // 게시물 내용
    private LocalDateTime createAt;   // 작성 일자 및 시간

    // 조인으로 가져올 정보들 (나중에 안 쓰면 지워도 돼용)
    private String categoryName;      // 카테고리 이름
    private String userName;          // 작성자 이름
}
