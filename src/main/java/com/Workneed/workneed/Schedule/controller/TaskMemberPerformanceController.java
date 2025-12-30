package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Schedule.dto.TaskMember1ResponseDTO;
import com.Workneed.workneed.Schedule.service.TaskMemberPerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedules")
public class TaskMemberPerformanceController {

    private final TaskMemberPerformanceService service;

    // 모달1 데이터 조회
    @GetMapping("/{scheduleId}/members/performance")
    public TaskMember1ResponseDTO getMembersPerformance(@PathVariable Long scheduleId) {
        return service.getModal1Data(scheduleId);
    }
}
