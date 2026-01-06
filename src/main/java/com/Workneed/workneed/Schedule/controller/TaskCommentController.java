package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Schedule.dto.TaskCommentDTO;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/schedule/comment")
public class TaskCommentController {

    private final TaskCommentMapper taskCommentMapper;

    public TaskCommentController(TaskCommentMapper taskCommentMapper) {
        this.taskCommentMapper = taskCommentMapper;
    }

    @PostMapping("/create")
    public String create(@RequestParam Long scheduleId,
                         @RequestParam String content) {

        TaskCommentDTO dto = new TaskCommentDTO();
        dto.setScheduleId(scheduleId);
        dto.setContent(content.trim());

        // 임시: 로그인 전까지 고정
        dto.setWriterId(1L);
        dto.setWriterName("민희");

        taskCommentMapper.insertComment(dto);

        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }

    @PostMapping("/update")
    public String update(@RequestParam Long scheduleId,
                         @RequestParam Long commentId,
                         @RequestParam String content) {

        if (content == null || content.trim().isEmpty()) {
            return "redirect:/schedule/task?scheduleId=" + scheduleId;
        }

        // 임시: 로그인 전까지 고정
        Long writerId = 1L;

        taskCommentMapper.updateComment(commentId, writerId, content.trim());

        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }

    @PostMapping("/delete")
    public String delete(@RequestParam Long scheduleId,
                         @RequestParam Long commentId) {

        // 임시: 로그인 전까지 고정 (작성자만 삭제 가능)
        Long writerId = 1L;

        taskCommentMapper.deleteComment(commentId, writerId);

        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }
}
