package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Chat.service.S3StorageService;
import com.Workneed.workneed.Meetingroom.mapper.MeetingRoomMapper;
import com.Workneed.workneed.Schedule.dto.MainScheduleDTO;
import com.Workneed.workneed.Schedule.dto.ScheduleDTO;
import com.Workneed.workneed.Schedule.dto.ScheduleFileDTO;
import com.Workneed.workneed.Schedule.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleMapper scheduleMapper;
    private final ScheduleParticipantMapper scheduleParticipantMapper;
    private final TaskCommentMapper taskCommentMapper;
    private final TaskMember2PerformanceMapper taskMember2PerformanceMapper;
    private  final MeetingRoomMapper meetingRoomMapper;
    private final ScheduleFileMapper scheduleFileMapper;
    private final S3StorageService s3StorageService;
    private final ScheduleMailService scheduleMailService;
    @Value("${app.base-url}")
    private String baseUrl;

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
        // schedule_file + S3 삭제
        for (Long scheduleId : scheduleIds) {

            //파일 조회
            List<ScheduleFileDTO> files = scheduleFileMapper.findFilesByScheduleId(scheduleId);

            //DB(schedule_file) 삭제
            scheduleFileMapper.deleteFilesByScheduleId(scheduleId);
        }

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

    public int getDoingScheduleCountAll(Long userId) {
        return scheduleMapper.countDoingSchedulesAll(userId);
    }

    public List<MainScheduleDTO> getMainTaskCardsByStatus(Long userId, String status) {
        return scheduleMapper.selectMainMyTaskCardsInDoingScheduleByStatus(userId, status);
    }

    @Transactional
    public void inviteTeamAndSendMail(
            Long scheduleId,
            Long inviterUserId,
            String inviterName,
            List<Long> userIds
    ) {

        log.info("inviteTeamAndSendMail 호출됨 - scheduleId={}, userIds={}", scheduleId, userIds);

        // OWNER 중복 초대 방지
        userIds.remove(inviterUserId);
        if (userIds.isEmpty()) return;

        // 1) DB 초대 반영
        scheduleParticipantMapper.inviteTeam(scheduleId, userIds);

        // 2) 커밋 성공 후 메일 발송
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {

                        ScheduleDTO schedule = scheduleMapper.selectById(scheduleId);
                        if (schedule == null) return;

                        List<String> emails =
                                scheduleMapper.selectEmailsByUserIds(userIds);

                        DateTimeFormatter fmt =
                                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

                        String startAt = schedule.getStartAt() == null
                                ? "-"
                                : schedule.getStartAt().format(fmt);

                        String endAt = schedule.getEndAt() == null
                                ? "-"
                                : schedule.getEndAt().format(fmt);

                        String link = baseUrl + "/schedule/task?scheduleId=" + scheduleId;

                        for (String email : emails) {
                            scheduleMailService.sendScheduleInviteEmail(
                                    email,
                                    inviterName,
                                    schedule.getTitle(),
                                    startAt,
                                    endAt,
                                    link
                            );
                        }
                    }
                }
        );


    }
}
