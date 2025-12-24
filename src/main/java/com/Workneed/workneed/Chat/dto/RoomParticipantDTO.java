package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomParticipantDTO {
    private Long roomId;
    private Long userId;
    private LocalDate joinedAt;
    private LocalDate leftAt;
}
