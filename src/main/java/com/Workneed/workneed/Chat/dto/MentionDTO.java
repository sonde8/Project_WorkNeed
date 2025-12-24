package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentionDTO {
    private Long mentionId;
    private Long messageId;
    private Long mentionedUserId;
    private Boolean isNotified;
}
