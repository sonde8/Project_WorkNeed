package com.Workneed.workneed.Schedule.dto;

import java.util.List;

public class ScheduleParticipantDTO {
    private ScheduleInvitedDTO owner;
    private List<ScheduleInvitedDTO> members;

    public ScheduleParticipantDTO(ScheduleInvitedDTO owner, List<ScheduleInvitedDTO> members) {
        this.owner = owner;
        this.members = members;
    }

    public ScheduleInvitedDTO getOwner() {return owner;}
    public void setOwner(ScheduleInvitedDTO owner) {this.owner = owner;}

    public List<ScheduleInvitedDTO> getMembers() {return members;}
    public void setMembers(List<ScheduleInvitedDTO> members) {this.members = members;}
}