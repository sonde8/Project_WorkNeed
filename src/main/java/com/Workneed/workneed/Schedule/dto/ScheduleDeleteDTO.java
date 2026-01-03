package com.Workneed.workneed.Schedule.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScheduleDeleteDTO {
    private List<Long> scheduleIds;
}
