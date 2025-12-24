package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Schedule.dto.ScheduleDTO;
import com.Workneed.workneed.Schedule.dto.TaskCommentDTO;
import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/schedule")
public class ScheduleController {

    private final ScheduleMapper scheduleMapper;
    private final TaskCommentMapper taskCommentMapper;

    public ScheduleController(ScheduleMapper scheduleMapper, TaskCommentMapper taskCommentMapper) {
        this.scheduleMapper = scheduleMapper;
        this.taskCommentMapper = taskCommentMapper;
    }

    @GetMapping("/kanban")
    public String kanban(Model model) {
        List<ScheduleDTO> todoList = scheduleMapper.selectByStatus("TODO");
        List<ScheduleDTO> doingList = scheduleMapper.selectByStatus("DOING");
        List<ScheduleDTO> doneList = scheduleMapper.selectByStatus("DONE");

        System.out.println("TODO size=" + todoList.size());
        System.out.println("DOING size=" + doingList.size());
        System.out.println("DONE size=" + doneList.size());

        model.addAttribute("todoList", todoList);
        model.addAttribute("doingList", doingList);
        model.addAttribute("doneList", doneList);

        return "schedule/kanban"; // templates/Schedule/kanban.html
    }

    @PostMapping("/create")
    public String create(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String status,
            @RequestParam String eventType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime startAt,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime endAt
    ) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setTitle(title);
        dto.setDescription(description);
        dto.setStatus(status);
        dto.setEventType(eventType);
        dto.setLocation(location);
        dto.setType(type);

        dto.setStartAt(startAt);
        dto.setEndAt(endAt);

        // 임시: 로그인 붙이기 전까지는 1로 고정
        dto.setCreatedBy(1L);

        scheduleMapper.insertSchedule(dto);

        return "redirect:/schedule/kanban";
    }

    @PostMapping("/status")
    @ResponseBody
    public String updateStatus(@RequestParam Long scheduleId,
                               @RequestParam String status) {
        scheduleMapper.updateStatus(scheduleId, status);
        return "OK";
    }

    @GetMapping("/task")
    public String task(@RequestParam Long scheduleId, Model model) {

        ScheduleDTO schedule = scheduleMapper.selectById(scheduleId);

        // 없는 id로 들어왔을 때
        if (schedule == null) {
            return "redirect:/schedule/kanban";
        }
        //댓글 조회
        List<TaskCommentDTO> commentList =
                taskCommentMapper.selectByScheduleId(scheduleId);

        model.addAttribute("schedule", schedule);
        model.addAttribute("commentList", commentList);

        return "schedule/task";
    }
}
