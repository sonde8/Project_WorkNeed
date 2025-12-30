package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Schedule.dto.TaskMember2ResponseDTO;
import com.Workneed.workneed.Schedule.mapper.TaskMember2PerformanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskMember2PerformanceService {
    private final TaskMember2PerformanceMapper mapper;

    public TaskMember2ResponseDTO getMemberTasks(Long scheduleId, Long userId) {

        var todoTasks  = mapper.selectTasksByStatus(scheduleId, userId, "TODO");
        var doingTasks = mapper.selectTasksByStatus(scheduleId, userId, "DOING");
        var doneTasks  = mapper.selectTasksByStatus(scheduleId, userId, "DONE");

        int todoCount  = mapper.countTasksByStatus(scheduleId, userId, "TODO");
        int doingCount = mapper.countTasksByStatus(scheduleId, userId, "DOING");
        int doneCount  = mapper.countTasksByStatus(scheduleId, userId, "DONE");

        TaskMember2ResponseDTO res = new TaskMember2ResponseDTO();
        res.setScheduleId(scheduleId);
        res.setUserId(userId);

        res.setPendingCount(todoCount + doingCount);
        res.setDoneCount(doneCount);

        res.setTodoTasks(todoTasks);
        res.setDoingTasks(doingTasks);
        res.setDoneTasks(doneTasks);

        return res;
    }

    public void addMemberTask(Long scheduleId, Long userId, String taskDescription) {
        mapper.insertMemberTask(scheduleId, userId, taskDescription);
    }

    public void updateTaskStatus(Long scheduleId, Long userId, Long taskId, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("personalStatus is required");
        }
        String s = status.trim().toUpperCase();
        if (!("TODO".equals(s) || "DOING".equals(s) || "DONE".equals(s))) {
            throw new IllegalArgumentException("Invalid personalStatus: " + status);
        }

        // 업데이트 실행
        int updated = mapper.updateTaskStatus(taskId, scheduleId, userId, s);

        // 업데이트 실패 방어
        if (updated == 0) {
            throw new IllegalArgumentException("Task not found or not allowed");
        }
    }
}
