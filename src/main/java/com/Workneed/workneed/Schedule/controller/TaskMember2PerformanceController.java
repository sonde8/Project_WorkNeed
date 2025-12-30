package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Schedule.dto.TaskMember2ResponseDTO;
import com.Workneed.workneed.Schedule.dto.TaskMemberCreateDTO;
import com.Workneed.workneed.Schedule.dto.TaskStatusUpdateDTO;
import com.Workneed.workneed.Schedule.service.TaskMember2PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedules")
public class TaskMember2PerformanceController {

    private final TaskMember2PerformanceService service;

    @GetMapping("/{scheduleId}/members/{userId}/tasks")
    public TaskMember2ResponseDTO getMemberTasks(@PathVariable Long scheduleId,
                                                 @PathVariable Long userId) {
        return service.getMemberTasks(scheduleId, userId);
    }


    @PostMapping("/{scheduleId}/members/{userId}/tasks")
    @ResponseBody
    public void createMemberTask(
            @PathVariable Long scheduleId,
            @PathVariable Long userId,
            @RequestBody TaskMemberCreateDTO dto
    ) {
        String desc = dto.getTaskDescription();
        if (desc == null || desc.trim().isEmpty()) {
            throw new IllegalArgumentException("taskDescription is required");
        }

        service.addMemberTask(scheduleId, userId, desc.trim());
    }

    @PatchMapping("/{scheduleId}/members/{userId}/tasks/{taskId}/status")
    public void updateTaskStatus(@PathVariable Long scheduleId,
                                 @PathVariable Long userId,
                                 @PathVariable Long taskId,
                                 @RequestBody TaskStatusUpdateDTO dto) {

        String status = dto.getPersonalStatus();
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("personalStatus is required");
        }

        if (!List.of("TODO", "DOING", "DONE").contains(status)) {
            throw new IllegalArgumentException("Invalid status");
        }

        service.updateTaskStatus(scheduleId, userId, taskId, status);
    }
}