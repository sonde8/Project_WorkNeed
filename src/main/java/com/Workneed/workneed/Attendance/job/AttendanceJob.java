package com.Workneed.workneed.Attendance.job;

import com.Workneed.workneed.Attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttendanceJob {

    private final AttendanceService attendanceService;

    @Scheduled(cron = "0 1 0 * * *", zone = "Asia/Seoul")
    public void autoMidnight(){
        attendanceService.autoYesterday();
    }
}
