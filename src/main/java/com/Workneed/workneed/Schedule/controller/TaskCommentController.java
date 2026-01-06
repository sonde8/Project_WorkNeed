package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Schedule.dto.TaskCommentDTO;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import jakarta.servlet.http.HttpSession;
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
                         @RequestParam String content,
                         HttpSession session) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        if (content == null || content.trim().isEmpty()) {
            return "redirect:/schedule/task?scheduleId=" + scheduleId;
        }

        TaskCommentDTO dto = new TaskCommentDTO();
        dto.setScheduleId(scheduleId);
        dto.setWriterId(loginUserId);
        dto.setContent(content.trim());

        taskCommentMapper.insertComment(dto);
        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }

    @PostMapping("/update")
    public String update(@RequestParam Long scheduleId,
                         @RequestParam Long commentId,
                         @RequestParam String content,
                         HttpSession session) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        if (content == null || content.trim().isEmpty()) {
            return "redirect:/schedule/task?scheduleId=" + scheduleId;
        }

        taskCommentMapper.updateComment(commentId, loginUserId, content.trim());
        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }

    @PostMapping("/delete")
    public String delete(@RequestParam Long scheduleId,
                         @RequestParam Long commentId,
                         HttpSession session) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        taskCommentMapper.deleteComment(commentId, loginUserId);
        return "redirect:/schedule/task?scheduleId=" + scheduleId;
    }

    private Long getLoginUserId(HttpSession session) {
        Object userObj = session.getAttribute("user");
        if (userObj instanceof com.Workneed.workneed.Members.dto.UserDTO u) {
            return u.getUserId();
        }
        Object adminObj = session.getAttribute("admin");
        if (adminObj instanceof com.Workneed.workneed.Members.dto.UserDTO a) {
            return a.getUserId();
        }
        return null;
    }
}