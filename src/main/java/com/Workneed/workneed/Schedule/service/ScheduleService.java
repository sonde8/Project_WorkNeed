package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Meetingroom.mapper.MeetingRoomMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleParticipantMapper;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import com.Workneed.workneed.Schedule.mapper.TaskMember2PerformanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleMapper scheduleMapper;
    private final ScheduleParticipantMapper scheduleParticipantMapper;
    private final TaskCommentMapper taskCommentMapper;
    private final TaskMember2PerformanceMapper taskMember2PerformanceMapper;
    private  final MeetingRoomMapper meetingRoomMapper;

    public Map<String, Object> getLinks(Long scheduleId) {
        return scheduleMapper.selectScheduleLinks(scheduleId);
    }

    @Transactional
    public void deleteSchedules(List<Long> scheduleIds, Long loginUserId) {

        // 참여자인지 체크(OWNER/MEMBER 상관없이)  private final MeetingRoomMapper meetingRoomMapper;
        int cnt = scheduleParticipantMapper.countParticipantSchedules(scheduleIds, loginUserId);
        if (cnt != scheduleIds.size()) {
            throw new RuntimeException("DELETE_PERMISSION_DENIED");
        }

        //자식 삭제
        taskCommentMapper.deleteByScheduleIds(scheduleIds);
        taskMember2PerformanceMapper.deleteByScheduleIds(scheduleIds);
        meetingRoomMapper.deleteReservationsByScheduleIds(scheduleIds);
        scheduleParticipantMapper.deleteByScheduleIds(scheduleIds);
        //부모 삭제
        scheduleMapper.deleteByScheduleIds(scheduleIds);
    }

    public void updateGitUrl(Long scheduleId, String gitUrl) {
        scheduleMapper.updateGitUrl(scheduleId, gitUrl);
    }

    public void updateFileStorageUrl(Long scheduleId, String fileStorageUrl) {
        scheduleMapper.updateFileStorageUrl(scheduleId, fileStorageUrl);
    }

    public void deleteGitUrl(Long scheduleId) {
        scheduleMapper.deleteGitUrl(scheduleId);
    }

    public void deleteFileStorageUrl(Long scheduleId) {
        scheduleMapper.deleteFileStorageUrl(scheduleId);
    }
}
