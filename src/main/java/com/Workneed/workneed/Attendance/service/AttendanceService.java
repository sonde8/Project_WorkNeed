package com.Workneed.workneed.Attendance.service;

import com.Workneed.workneed.Attendance.dto.*;
import com.Workneed.workneed.Attendance.mapper.AttendanceMapper;
import com.Workneed.workneed.Attendance.mapper.LeaveMapper;
import com.Workneed.workneed.Attendance.mapper.TeamAttendMapper;
import com.Workneed.workneed.Members.dto.AttendanceRequestCreateDTO; // 경로 확인 필요
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceMapper attendanceMapper;
    private final LeaveMapper leaveMapper;
    private final TeamAttendMapper teamAttendMapper;

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    /* ==================================================================================
       신규 추가: 근태 수정 요청 로직
       ================================================================================== */

    /**
     * 사용자가 신청한 근태 수정 요청을 검증하고 DB에 저장합니다.
     */
    @Transactional
    public void createRequest(AttendanceRequestCreateDTO dto) {
        LocalTime start = dto.getStartTime();
        LocalTime end = dto.getEndTime();

        // null 방어 (최우선)
        if (start == null || end == null) {
            throw new IllegalArgumentException("시작/종료 시간은 필수입니다.");
        }

        // 시간 선후 관계
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("종료 시간은 시작 시간보다 늦어야 합니다.");
        }

        // 야간 시간 제한
        if (isInvalidRequestTime(start) || isInvalidRequestTime(end)) {
            throw new IllegalArgumentException("22:00부터 07:00 사이의 시간은 수정 요청이 불가능합니다.");
        }

        // 저장
        attendanceMapper.insertAttendanceRequest(dto);
    }

    /**
     * 입력된 시간이 야간 제한 시간(22시~07시)에 포함되는지 확인합니다.
     */
    private boolean isInvalidRequestTime(LocalTime time) {
        int hour = time.getHour();
        return hour >= 22 || hour < 7;
    }

    /* ==================================================================================
       기존 로직: 출퇴근 및 요약 로직 (유지)
       ================================================================================== */

    // 00:00 ~ 07:00 출근버튼 차단 (실시간 버튼 클릭용)
    private void blockCheckTime() {
        int tH = java.time.LocalTime.now().getHour();
        if (tH >= 22 || tH < 7) {
            throw new IllegalArgumentException("7시 이후에 눌러주세요");
        }
    }

    // 출근
    public void checkIn(Long empId) {
        blockCheckTime();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        String isLate = now.toLocalTime().isAfter(LocalTime.of(9, 10)) ? "Y" : "N";
        attendanceMapper.upsertCheckIn(empId, today, now, isLate, "CHECKED_IN");
    }

    // 퇴근
    public void checkOut(Long empId) {
        LocalDate today = LocalDate.now();
        AttendanceDTO saved = attendanceMapper.findByEmpAndDate(empId, today);

        if (saved == null || saved.getCheckInTime() == null) {
            throw new IllegalStateException("출근 기록이 없습니다");
        }
        if (saved.getCheckOutTime() != null) return;

        LocalDateTime now = LocalDateTime.now();
        int workMin = (int) Duration.between(saved.getCheckInTime(), now).toMinutes();
        if (workMin < 0) workMin = 0;

        LocalDateTime otBase = LocalDateTime.of(today, LocalTime.of(18, 10));
        LocalDateTime startForOt = saved.getCheckInTime().isAfter(otBase) ? saved.getCheckInTime() : otBase;
        int otMin = (int) Duration.between(startForOt, now).toMinutes();
        if (otMin < 0) otMin = 0;

        String isEarlyLeave = now.toLocalTime().isBefore(LocalTime.of(17, 50)) ? "Y" : "N";
        attendanceMapper.updateCheckOut(empId, today, now, workMin, otMin, isEarlyLeave, "CHECKED_OUT");
    }

    // 자동 퇴근 처리 (자정 스케줄러용 등)
    public void autoYesterday() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<AttendanceDTO> list = attendanceMapper.findCheckOut(yesterday);

        for (AttendanceDTO row : list) {
            Long empId = row.getEmpId();
            LocalDateTime inTime = row.getCheckInTime();
            if (inTime == null) continue;

            LocalTime inLocal = inTime.toLocalTime();
            LocalDateTime fixedOut;
            if (inLocal.isBefore(LocalTime.of(18, 0))) {
                fixedOut = LocalDateTime.of(yesterday, LocalTime.of(18, 0));
            } else {
                fixedOut = LocalDateTime.of(yesterday, LocalTime.of(22, 0));
            }

            int workMin = (int) Duration.between(inTime, fixedOut).toMinutes();
            if (workMin < 0) workMin = 0;

            LocalDateTime otBase = LocalDateTime.of(yesterday, LocalTime.of(18, 10));
            LocalDateTime startForOt = inTime.isAfter(otBase) ? inTime : otBase;
            int otMin = (int) Duration.between(startForOt, fixedOut).toMinutes();
            if (otMin < 0) otMin = 0;

            String isEarlyLeave = fixedOut.toLocalTime().isBefore(LocalTime.of(17, 50)) ? "Y" : "N";
            attendanceMapper.autoCheckOut(empId, yesterday, fixedOut, workMin, otMin, isEarlyLeave, "AUTO_CHECKED_OUT");
        }
    }

    public boolean checkoutYesterdayAuto(Long empId) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        return attendanceMapper.countAutoCheckout(empId, yesterday) > 0;
    }

    public void checkoutNotice(Long empId) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        attendanceMapper.markCheck(empId, yesterday);
    }

    public AttendanceResponseDTO summary(Long empId, LocalDate baseDate) {

        LocalDate weekStart = baseDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(7);

        LocalDate monthStart = baseDate.withDayOfMonth(1);
        LocalDate monthEnd = monthStart.plusMonths(1);


        AttendanceDTO baseRow = attendanceMapper.findByEmpAndDate(empId, baseDate);
        String checkIn = (baseRow != null && baseRow.getCheckInTime() != null) ? baseRow.getCheckInTime().format(HHMM) : null;
        String checkOut = (baseRow != null && baseRow.getCheckOutTime() != null) ? baseRow.getCheckOutTime().format(HHMM) : null;

        String statusText = "업무 상태 변경하기";
        if (baseRow != null && baseRow.getStatusCode() != null) {
            if ("CHECKED_IN".equals(baseRow.getStatusCode())) statusText = "출근";
            else if ("CHECKED_OUT".equals(baseRow.getStatusCode())) statusText = "퇴근";
            else if ("AUTO_CHECKED_OUT".equals(baseRow.getStatusCode())) statusText = "퇴근";
        }

        int weekWorkMin = attendanceMapper.workMinutes(empId, weekStart, weekEnd);
        int monthWorkMin = attendanceMapper.workMinutes(empId, monthStart, monthEnd);
        int holidayWorkMin = attendanceMapper.holidayMinutes(empId, weekStart, weekEnd);

        int base52 = 52 * 60;
        int base18 = 18 * 60;
        int over52Min = Math.max(0, weekWorkMin - base52);
        int remainWorkMin = Math.max(0, base52 - weekWorkMin);
        int remainOtMin = Math.max(0, base18 - over52Min);
        boolean over52 = weekWorkMin > base52;

        int maxBarMin = 70 * 60;
        int weekPercent = (int) Math.round(Math.min(100.0, (weekWorkMin * 100.0) / maxBarMin));

        return AttendanceResponseDTO.builder()
                .todayCheckIn(checkIn).todayCheckOut(checkOut).todayStatusText(statusText)
                .weekWorkMin(weekWorkMin).monthWorkMin(monthWorkMin).holidayWorkMin(holidayWorkMin)
                .weekTotal(toHM(weekWorkMin)).monthTotal(toHM(monthWorkMin)).holidayTotal(toHM(holidayWorkMin))
                .remainWork(toHM(remainWorkMin)).remainOt(toHM(remainOtMin)).over52(over52)
                .weekPercent(weekPercent).progressText("52h / " + toHM(weekWorkMin)).build();
    }


    private String toHM(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        return h + "h " + m + "m";
    }

    // 출근부 데이터 구성
    public List<AttendanceBookDTO> book(Long empId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1);

        List<AttendanceDTO> rows = attendanceMapper.timeCard(empId, start, end);
        Map<LocalDate, AttendanceDTO> attMap = rows.stream()
                .filter(r -> r.getWorkDate() != null)
                .collect(Collectors.toMap(AttendanceDTO::getWorkDate, r -> r, (a, b) -> a));

        List<LeaveUseDTO> leaves = leaveMapper.selectLeaveUsage(empId, start, end);
        Map<LocalDate, LeaveUseDTO> leaveMap = new HashMap<>();
        for (LeaveUseDTO lv : leaves) {
            if (lv.getStartDate() == null || lv.getEndDate() == null) continue;
            LocalDate s = lv.getStartDate();
            LocalDate e = lv.getEndDate();
            if (s.isBefore(start)) s = start;
            if (e.isAfter(end.minusDays(1))) e = end.minusDays(1);
            for (LocalDate d = s; !d.isAfter(e); d = d.plusDays(1)) {
                leaveMap.putIfAbsent(d, lv);
            }
        }

        List<AttendanceBookDTO> result = new ArrayList<>();
        for (LocalDate d = start; d.isBefore(end); d = d.plusDays(1)) {
            AttendanceDTO att = attMap.get(d);
            LeaveUseDTO lv = leaveMap.get(d);
            if (att == null && lv == null) {
                result.add(new AttendanceBookDTO(d.toString(), "", "", "", null, null));
                continue;
            }
            String type = makeType(att, lv, d);
            String checkIn = (att != null && att.getCheckInTime() != null) ? att.getCheckInTime().toLocalTime().format(HHMM) : "";
            String checkOut = (att != null && att.getCheckOutTime() != null) ? att.getCheckOutTime().toLocalTime().format(HHMM) : "";
            Integer otMin = (att == null || att.getOvertimeMinutes() == null) ? 0 : att.getOvertimeMinutes();
            Integer workMin = (att == null || att.getWorkMinutes() == null) ? 0 : att.getWorkMinutes();
            result.add(new AttendanceBookDTO(d.toString(), type, checkIn, checkOut, otMin, workMin));
        }
        return result;
    }

    private String makeType(AttendanceDTO att, LeaveUseDTO lv, LocalDate date) {
        String leavePart = null;
        if (lv != null && lv.getLeaveType() != null) {
            leavePart = switch (lv.getLeaveType()) {
                case "ANNUAL" -> "연차";
                case "HALF_AM" -> "오전반차";
                case "HALF_PM" -> "오후반차";
                default -> "기타";
            };
        }
        boolean hasCheckIn = (att != null && att.getCheckInTime() != null);
        DayOfWeek dow = date.getDayOfWeek();
        boolean weekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);

        if (hasCheckIn && weekend) return (leavePart != null) ? (leavePart + " / 휴일 근무") : "휴일 근무";
        if (leavePart != null && !hasCheckIn) return leavePart;
        boolean hasHalf = "오전반차".equals(leavePart) || "오후반차".equals(leavePart);
        if (leavePart != null && hasCheckIn) return leavePart + " / 출근";
        if (hasCheckIn) {
            if (hasHalf) return "정상";
            return "Y".equals(att.getIsLate()) ? "지각" : "정상";
        }
        return "";
    }

    // 팀 근태 현황
    public List<TeamAttendRowDTO> teamAttend(Long loginUserId, int year, int month) {
        Long deptId = teamAttendMapper.findTeamUserId(loginUserId);
        if (deptId == null) return List.of();

        List<TeamMemberDTO> members = teamAttendMapper.findTeamMembers(deptId);
        if (members == null || members.isEmpty()) return List.of();

        List<Long> empIds = members.stream().map(TeamMemberDTO::getUserId).toList();
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.plusMonths(1);
        LocalDate week1Start = monthStart.minusDays(monthStart.getDayOfWeek().getValue() % 7);

        Map<Long, TeamAggDTO> monthAgg = toMap(attendanceMapper.aggTeam(empIds, monthStart, monthEnd));
        Map<Long, TeamAggDTO> w1 = toMap(attendanceMapper.aggTeam(empIds, week1Start, week1Start.plusDays(7)));
        Map<Long, TeamAggDTO> w2 = toMap(attendanceMapper.aggTeam(empIds, week1Start.plusDays(7), week1Start.plusDays(14)));
        Map<Long, TeamAggDTO> w3 = toMap(attendanceMapper.aggTeam(empIds, week1Start.plusDays(14), week1Start.plusDays(21)));
        Map<Long, TeamAggDTO> w4 = toMap(attendanceMapper.aggTeam(empIds, week1Start.plusDays(21), week1Start.plusDays(28)));
        Map<Long, TeamAggDTO> w5 = toMap(attendanceMapper.aggTeam(empIds, week1Start.plusDays(28), week1Start.plusDays(35)));

        List<TeamAttendRowDTO> rows = new ArrayList<>();
        for (TeamMemberDTO m : members) {
            Long empId = m.getUserId();
            int monthWorkMin = getInt(monthAgg.get(empId) == null ? null : monthAgg.get(empId).getWorkMin());
            rows.add(TeamAttendRowDTO.builder()
                    .empId(empId).nameWithRank(m.getNameRank()).monthTotal(toHM(monthWorkMin))
                    .w1(toWeek(w1.get(empId))).w2(toWeek(w2.get(empId))).w3(toWeek(w3.get(empId)))
                    .w4(toWeek(w4.get(empId))).w5(toWeek(w5.get(empId))).build());
        }
        return rows;
    }

    private Map<Long, TeamAggDTO> toMap(List<TeamAggDTO> list) {
        if (list == null) return new HashMap<>();
        Map<Long, TeamAggDTO> map = new HashMap<>();
        for (TeamAggDTO a : list) {
            if (a == null || a.getEmpId() == null) continue;
            map.put(a.getEmpId(), a);
        }
        return map;
    }

    private WeekSummaryDTO toWeek(TeamAggDTO a) {
        int normal = (a == null) ? 0 : getInt(a.getNormalMin());
        int ot = (a == null) ? 0 : getInt(a.getOvertimeMin());
        int hol = (a == null) ? 0 : getInt(a.getHolidayMin());
        int late = (a == null) ? 0 : getInt(a.getLateCount());
        return WeekSummaryDTO.builder().normal(toHM(normal)).overtime(toHM(ot)).holiday(toHM(hol)).late(late).build();
    }

    private int getInt(Integer v) {
        return (v == null) ? 0 : v;
    }

    public Map<String, Object> monthSummary(Long empId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1);
        int workDays = attendanceMapper.countWorkDays(empId, startDate, endDate);
        int lateCount = attendanceMapper.countLate(empId, startDate, endDate);
        int earlyCount = attendanceMapper.countEarlyLeave(empId, startDate, endDate);
        return Map.of("year", year, "month", month, "workDays", workDays, "lateCount", lateCount, "earlyCount", earlyCount);
    }

    public Map<String, Object> yearSummary(Long empId, int year) {
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = startDate.plusYears(1);
        int workMin = attendanceMapper.workMinutes(empId, startDate, endDate);
        int otMin = attendanceMapper.overtimeMinutes(empId, startDate, endDate);
        int holMin = attendanceMapper.holidayMinutes(empId, startDate, endDate);
        return Map.of("workHours", workMin / 60, "otHours", otMin / 60, "holidayHours", holMin / 60);
    }
}