package com.Workneed.workneed.Attendance.service;

import com.Workneed.workneed.Approval.LeaveType;
import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import com.Workneed.workneed.Approval.service.ApprovalLeaveService;
import com.Workneed.workneed.Attendance.dto.*;
import com.Workneed.workneed.Attendance.mapper.LeaveMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveMapper leaveMapper;
    private final ApprovalLeaveService approvalLeaveService;

    // 1일 8시간
    private static final int DAY_MIN = 8 * 60;

    // 신청(자동승인)
    @Transactional
    public void applyLeave(Long userId, LeaveRequestDTO req) {

        // ====== 기본 방어 ======
        if (userId == null) {
            throw new IllegalArgumentException("유저 정보가 없습니다");
        }
        if (req == null) {
            throw new IllegalArgumentException("요청 값이 없습니다");
        }
        if (req.getLeaveType() == null) {
            throw new IllegalArgumentException("휴가 종류를 선택해주세요");
        }
        if (req.getStartDate() == null || req.getEndDate() == null) {
            throw new IllegalArgumentException("시작일/종료일이 필요합니다");
        }
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("종료일은 시작일보다 빠를 수 없습니다");
        }

        // ====== 동일 날짜 신청 방지 ======
        int overlap = leaveMapper.countOver(userId, req.getStartDate(), req.getEndDate());
        if (overlap > 0) {
            throw new IllegalArgumentException("해당 날짜에 이미 휴가를 사용했습니다");
        }

        // ====== 반차는 하루만 가능 ======
        if (isHalf(req.getLeaveType()) && !req.getStartDate().equals(req.getEndDate())) {
            throw new IllegalArgumentException("반차는 하루만 사용 가능합니다");
        }

        // ====== 사유 ======
        String reason = req.getReason() == null ? "" : req.getReason().trim();
        if (reason.isEmpty()) {
            throw new IllegalArgumentException("사유를 꼭 적어주세요");
        }
        req.setReason(reason);

        // ====== 주말 신청 막기 ======
        leaveWeekend(req.getStartDate(), req.getEndDate());

        // ====== 요청 분(min) 계산 ======
        int reqMin = requestMinutes(req.getLeaveType(), req.getStartDate(), req.getEndDate());

        // ====== 잔여 확인 ======
        int year = req.getStartDate().getYear();
        LeaveSummaryCalc calc = summaryMinutes(userId, year);

        if (calc.remainMin <= 0) {
            throw new IllegalArgumentException("사용할 수 있는 연차가 없습니다");
        }

        if (reqMin > calc.remainMin) {
            throw new IllegalArgumentException("잔여 연차가 적습니다");
        }

        // ====== 요청 기록 ======
        LeaveRequestInsertDTO r = new LeaveRequestInsertDTO();
        r.setUserId(userId);
        r.setRequestType("LEAVE");
        r.setStatus("APPROVED");

        // payload에는 코드값(name) 저장을 권장합니다
        String payload = String.format(
                "{\"leaveType\":\"%s\",\"start\":\"%s\",\"end\":\"%s\",\"reason\":\"%s\"}",
                req.getLeaveType().name(),
                req.getStartDate(),
                req.getEndDate(),
                req.getReason().replace("\"", "\\\"")
        );

        r.setRequestPayload(payload);
        leaveMapper.insertRequest(r);

        // ====== 사용 내역 ======
        double days = calcDays(req.getLeaveType(), req.getStartDate(), req.getEndDate());

        LeaveUsageInsertDTO u = new LeaveUsageInsertDTO();
        u.setRequestId(r.getRequestId());
        u.setUserId(userId);

        // ⚠️ 여기 중요:
        // LeaveUsageInsertDTO.leaveType이 DB 컬럼(VARCHAR)일 가능성이 높아서 name()으로 저장합니다.
        // 만약 LeaveUsageInsertDTO가 LeaveType을 받도록 되어 있다면 이 줄을 u.setLeaveType(req.getLeaveType()); 로 바꾸면 됩니다.
        u.setLeaveType(req.getLeaveType().name());

        u.setStartDate(req.getStartDate());
        u.setEndDate(req.getEndDate());
        u.setReason(req.getReason());

        leaveMapper.insertLeaveUsage(u);

        // ====== 전자결재 ======
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setLeaveType(req.getLeaveType()); // enum 그대로 전달
        dto.setStartDate(req.getStartDate());
        dto.setEndDate(req.getEndDate());
        dto.setReason(req.getReason());

        approvalLeaveService.submitLeave(dto, userId);
    }

    // 주말엔 연차 금지
    private void leaveWeekend(LocalDate start, LocalDate end) {

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                throw new IllegalArgumentException("주말에는 연차를 신청할 수 없습니다");
            }
        }
    }

    // 연차관리 리스트
    public List<LeaveUseDTO> listByYear(Long userId, int year) {

        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = start.plusYears(1);

        return leaveMapper.selectLeaveUsage(userId, start, end);
    }

    // 연차 요약
    public LeaveSummaryDTO summary(Long userId, int year) {

        LeaveSummaryCalc c = summaryMinutes(userId, year);

        return LeaveSummaryDTO.builder()
                .carryLeave(minToLabelDH(c.carryMin))
                .totalLeave(minToLabelDH(c.totalMin))
                .usedLeave(minToLabelDH(c.usedMin))
                .remainLeave(minToLabelDH(c.remainMin))
                .carryMin(c.carryMin)
                .totalMin(c.totalMin)
                .usedMin(c.usedMin)
                .remainMin(c.remainMin)
                .build();
    }

    // 계산
    private static class LeaveSummaryCalc {
        int carryMin;
        int totalMin;
        int usedMin;
        int remainMin;
    }

    private LeaveSummaryCalc summaryMinutes(Long userId, int year) {

        LocalDate joinDate = leaveMapper.selectUserJoinDate(userId);
        if (joinDate == null) joinDate = LocalDate.of(year, 1, 1);

        LocalDate today = LocalDate.now();

        // 올해 적립
        int accruedThisYearMin = accruedMinutes(joinDate, year, today);

        // 올해 사용
        int usedThisYearMin = usedMinutesForYear(userId, year);

        // 전년도 이월
        int prev = year - 1;
        int accruedPrevMin = accruedMinutes(joinDate, prev, LocalDate.of(prev, 12, 31));
        int usedPrevMin = usedMinutesForYear(userId, prev);

        int carryMin = Math.max(0, accruedPrevMin - usedPrevMin);

        int totalMin = accruedThisYearMin + carryMin;
        int remainMin = Math.max(0, totalMin - usedThisYearMin);

        LeaveSummaryCalc c = new LeaveSummaryCalc();
        c.carryMin = carryMin;
        c.totalMin = totalMin;
        c.usedMin = usedThisYearMin;
        c.remainMin = remainMin;

        return c;
    }

    // 적립
    private int accruedMinutes(LocalDate joinDate, int year, LocalDate asOf) {

        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);

        LocalDate end = asOf.isAfter(yearEnd) ? yearEnd : asOf;

        if (end.isBefore(yearStart)) return 0;
        if (joinDate.isAfter(end)) return 0;

        int total = 0;

        // 가입 시
        if (joinDate.getYear() == year) {
            if (!joinDate.isAfter(end)) {
                total += DAY_MIN * 3;
            }
        }

        // 매달 1일 연차 지급
        LocalDate startAccrue;

        if (year == joinDate.getYear()) {
            startAccrue = joinDate.plusMonths(1).withDayOfMonth(1);
        } else if (year > joinDate.getYear()) {
            startAccrue = LocalDate.of(year, 1, 1);
        } else {
            return 0;
        }

        for (int m = 1; m <= 12; m++) {
            LocalDate d = LocalDate.of(year, m, 1);
            if (d.isBefore(startAccrue)) continue;
            if (d.isAfter(end)) continue;
            total += DAY_MIN;
        }

        return total;
    }

    // 사용(여기는 DB에서 String으로 가져오는 구조라 그대로 둡니다)
    private int usedMinutesForYear(Long userId, int year) {

        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = start.plusYears(1);

        List<LeaveUseDTO> list = leaveMapper.selectLeaveUsage(userId, start, end);

        int sum = 0;

        for (LeaveUseDTO lv : list) {
            String t = lv.getLeaveType();
            if (t == null) continue;

            if ("HALF_AM".equals(t) || "HALF_PM".equals(t)) {
                sum += 4 * 60;
                continue;
            }

            LocalDate s = lv.getStartDate();
            LocalDate e = lv.getEndDate();
            if (s == null || e == null) continue;

            // 연도 범위로 clamp
            if (s.isBefore(start)) s = start;
            if (e.isAfter(end.minusDays(1))) e = end.minusDays(1);

            long days = Duration.between(s.atStartOfDay(), e.plusDays(1).atStartOfDay()).toDays();
            if (days <= 0) continue;

            sum += (int) days * DAY_MIN;
        }

        return sum;
    }

    // ====== enum 기반 계산 메서드(여기가 이번 수정의 핵심) ======

    private boolean isHalf(LeaveType leaveType) {
        return leaveType == LeaveType.HALF_AM || leaveType == LeaveType.HALF_PM;
    }

    // 신청 계산 (enum)
    private int requestMinutes(LeaveType leaveType, LocalDate start, LocalDate end) {

        if (isHalf(leaveType)) return 4 * 60;

        long days = Duration.between(start.atStartOfDay(), end.plusDays(1).atStartOfDay()).toDays();
        if (days <= 0) days = 1;

        return (int) days * DAY_MIN;
    }

    // 일수 계산 (enum)
    private double calcDays(LeaveType leaveType, LocalDate start, LocalDate end) {

        if (isHalf(leaveType)) return 0.50;

        long d = Duration.between(start.atStartOfDay(), end.plusDays(1).atStartOfDay()).toDays();
        return Math.max(1, d);
    }

    // 분 표시
    private String minToLabelDH(int min) {

        if (min <= 0) return "0d 0h";

        int d = min / DAY_MIN;
        int h = (min % DAY_MIN) / 60;

        return d + "d " + h + "h";
    }
}
