package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Schedule.dto.ScheduleInvitedDTO;
import com.Workneed.workneed.Schedule.dto.ScheduleParticipantDTO;
import com.Workneed.workneed.Schedule.mapper.ScheduleInvitedMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleParticipantService {

    private final ScheduleInvitedMapper scheduleInvitedMapper;

    public ScheduleParticipantService(ScheduleInvitedMapper scheduleInvitedMapper) {
        this.scheduleInvitedMapper = scheduleInvitedMapper;
    }

    public ScheduleParticipantDTO getParticipants(Long scheduleId) {
        ScheduleInvitedDTO owner = scheduleInvitedMapper.selectOwnerByScheduleId(scheduleId);
        List<ScheduleInvitedDTO> members = scheduleInvitedMapper.selectMembersByScheduleId(scheduleId);

        return new ScheduleParticipantDTO(owner, members);
    }
}