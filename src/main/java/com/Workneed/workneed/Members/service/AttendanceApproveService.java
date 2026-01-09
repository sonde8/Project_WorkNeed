package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.AttendancePayload;
import com.Workneed.workneed.Members.dto.MemberAttendanceDTO;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.MemberAttendanceMapper;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceApproveService {

    private final RequestMapper requestMapper;
    private final ObjectMapper objectMapper;
    private final MemberAttendanceMapper memberAttendanceMapper;
    private final AdminUserMapper adminUserMapper;

    @Transactional
    public void approve(Long requestId, Long adminId) {
        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (req == null) throw new IllegalArgumentException("요청이 없습니다.");
            if (!"PENDING".equals(req.getStatus())) return;

            AttendancePayload payload =
                    objectMapper.readValue(req.getRequestPayload(), AttendancePayload.class);

            String type = payload.getType();

            // attendance 조회
            MemberAttendanceDTO attendance =
                    memberAttendanceMapper.findByUserAndDate(req.getUserId(), payload.getWorkDate());

            // 타입별 업데이트
            if ("OVERTIME".equals(type)) {

                if (payload.getFromTime() == null || payload.getToTime() == null) {
                    throw new IllegalArgumentException("OVERTIME 요청은 fromTime/toTime이 필수입니다.");
                }

                int minutes = (int) Duration.between(payload.getFromTime(), payload.getToTime()).toMinutes();
                if (minutes <= 0) throw new IllegalArgumentException("연장근무 시간이 올바르지 않습니다.");

                if (attendance == null) {
                    memberAttendanceMapper.insertOvertime(req.getUserId(), payload.getWorkDate(), minutes);
                } else {
                    memberAttendanceMapper.updateOvertime(attendance.getAttendanceId(), minutes);
                }

            } else if ("CHECK_IN".equals(type)) {

                if (payload.getFromTime() == null) {
                    throw new IllegalArgumentException("CHECK_IN 요청은 fromTime이 필요합니다.");
                }

                LocalDateTime checkInAt = payload.getWorkDate().atTime(payload.getFromTime());

                if (attendance != null && attendance.getCheckOutTime() != null) {
                    if (checkInAt.isAfter(attendance.getCheckOutTime())) {
                        throw new IllegalArgumentException("출근시간은 퇴근시간보다 늦을 수 없습니다.");
                    }
                }

                if (attendance == null) {
                    memberAttendanceMapper.insertCheckIn(req.getUserId(), payload.getWorkDate(), checkInAt);
                } else {
                    memberAttendanceMapper.updateCheckIn(attendance.getAttendanceId(), checkInAt);
                }

            } else if ("CHECK_OUT".equals(type)) {

                if (payload.getToTime() == null) {
                    throw new IllegalArgumentException("CHECK_OUT 요청은 toTime이 필요합니다.");
                }

                LocalDateTime checkOutAt = payload.getWorkDate().atTime(payload.getToTime());

                if (attendance != null && attendance.getCheckInTime() != null) {
                    if (checkOutAt.isBefore(attendance.getCheckInTime())) {
                        throw new IllegalArgumentException("퇴근시간은 출근시간보다 빠를 수 없습니다.");
                    }
                }

                if (attendance == null) {
                    memberAttendanceMapper.insertCheckOut(req.getUserId(), payload.getWorkDate(), checkOutAt);
                } else {
                    memberAttendanceMapper.updateCheckOut(attendance.getAttendanceId(), checkOutAt);
                }

            } else {
                throw new IllegalStateException("알 수 없는 type: " + type);
            }

            //  update 끝난 직후 재조회 + 재계산
            MemberAttendanceDTO after =
                    memberAttendanceMapper.findByUserAndDate(req.getUserId(), payload.getWorkDate());
            recalcAndUpdate(after);

            //b요청 승인 처리
            requestMapper.approve(requestId, adminId);

            // 관리자 로그
            adminUserMapper.insertActivityLog(
                    AdminUserDTO.builder()
                            .adminId(adminId)
                            .logActionType("APPROVE_ATTENDANCE")
                            .logTargetType("ATTENDANCE")
                            .logTargetId(req.getUserId())
                            .logDescription("근태 수정 승인")
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException("근태 승인 처리 실패", e);
        }
    }


    // ❌ 반려
    @Transactional
    public void reject(Long requestId, Long adminId, String reason) {
        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (req == null) throw new IllegalArgumentException("요청이 없습니다.");
            if (!"PENDING".equals(req.getStatus())) return;

            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException("반려 사유는 필수입니다.");
            }

            // 기존 payload(JSON) 읽어서 rejectReason 추가
            Map<String, Object> payloadMap =
                    objectMapper.readValue(req.getRequestPayload(), Map.class);
            payloadMap.put("rejectReason", reason.trim());

            // DB 업데이트 (status=REJECTED + payload 덮어쓰기)
            requestMapper.reject(
                    requestId,
                    adminId,
                    objectMapper.writeValueAsString(payloadMap)
            );

            // 관리자 로그
            adminUserMapper.insertActivityLog(
                    AdminUserDTO.builder()
                            .adminId(adminId)
                            .logActionType("REJECT_ATTENDANCE")
                            .logTargetType("ATTENDANCE")
                            .logTargetId(req.getUserId())
                            .logDescription("근태 수정 반려: " + reason.trim())
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException("근태 반려 처리 실패", e);
        }
    }

    private void recalcAndUpdate(MemberAttendanceDTO att) {
        if (att == null) return;

        // 한쪽만 있으면 계산값 0 + 상태는 일단 N 처리(원하면 KEEP도 가능)
        if (att.getCheckInTime() == null || att.getCheckOutTime() == null) {
            memberAttendanceMapper.updateCalculatedFields(
                    att.getAttendanceId(),
                    0, 0,
                    "N", "N",
                    "APPROVED_EDIT"
            );
            return;
        }

        // 근로시간
        int workMinutes = (int) Duration.between(att.getCheckInTime(), att.getCheckOutTime()).toMinutes();
        if (workMinutes < 0) workMinutes = 0;

        var lateCut = att.getWorkDate().atTime(9, 10);
        var standardEnd = att.getWorkDate().atTime(18, 10);

        // 지각 여부
        String isLate = att.getCheckInTime().isAfter(lateCut) ? "Y" : "N";

        // 조퇴 여부
        String isEarlyLeave = att.getCheckOutTime().isBefore(standardEnd) ? "Y" : "N";

        // 연장근무
        int overtimeMinutes = (int) Duration.between(standardEnd, att.getCheckOutTime()).toMinutes();
        if (overtimeMinutes < 0) overtimeMinutes = 0;

        memberAttendanceMapper.updateCalculatedFields(
                att.getAttendanceId(),
                workMinutes,
                overtimeMinutes,
                isLate,
                isEarlyLeave,
                "APPROVED_EDIT"
        );
    }


}
