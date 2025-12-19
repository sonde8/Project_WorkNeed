package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Rank {
    private Long rankId;
    private String rankName;
    private Integer rankLevel;
    private LocalDateTime rankCreatedAt;


}
