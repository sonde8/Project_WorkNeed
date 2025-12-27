package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankDTO {
    private Long rankId;
    private String rankName;
    private Integer rankLevel;
    private LocalDateTime rankCreatedAt;


}
