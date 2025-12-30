package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Schedule.dto.ScheduleDTO;
import com.Workneed.workneed.Schedule.dto.ScheduleInvitedDTO;
import com.Workneed.workneed.Schedule.dto.TaskCommentDTO;
import com.Workneed.workneed.Schedule.mapper.ScheduleInvitedMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleParticipantMapper;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import jakarta.servlet.http.HttpSession;
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
    private final ScheduleParticipantMapper scheduleParticipantMapper;
    private final ScheduleInvitedMapper scheduleInvitedMapper;

    private final TaskCommentMapper taskCommentMapper;

    public ScheduleController(ScheduleMapper scheduleMapper, ScheduleParticipantMapper scheduleParticipantMapper,
                              ScheduleInvitedMapper scheduleInvitedMapper, TaskCommentMapper taskCommentMapper) {
        this.scheduleMapper = scheduleMapper;
        this.scheduleParticipantMapper = scheduleParticipantMapper;
        this.scheduleInvitedMapper = scheduleInvitedMapper;
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

        Long loginUserId = 1L; // 임시
        dto.setCreatedBy(loginUserId);

        // PERSONAL이면 invited_by는 null
        if ("PERSONAL".equalsIgnoreCase(type)) {
            dto.setInvitedBy(null);
        }

        // schedule 저장
        scheduleMapper.insertSchedule(dto);

        // scheduleId
        Long scheduleId = dto.getScheduleId();

        // OWNER 등록
        scheduleParticipantMapper.inviteOwner(scheduleId, loginUserId);

        // 타입별 분기
        if ("PERSONAL".equalsIgnoreCase(type)) {
            return "redirect:/schedule/kanban";
        }

        if ("TEAM".equalsIgnoreCase(type)) {
            return "redirect:/schedule/invite?scheduleId=" + scheduleId;
        }

        if ("COMPANY".equalsIgnoreCase(type)) {
            scheduleParticipantMapper.inviteCompany(scheduleId, loginUserId);
            return "redirect:/schedule/kanban";
        }

        return "redirect:/schedule/kanban";
    }

    @GetMapping("/invite")
    public String invitePage(@RequestParam Long scheduleId, Model model) {

        // (권장) schedule 존재 확인
        ScheduleDTO schedule = scheduleMapper.selectById(scheduleId);
        if (schedule == null) return "redirect:/schedule/kanban";

        // 초대 후보 목록(부서별로 보여줄 거라 했으니 Dept 기준으로 조회)
        // -> 이건 UserMapper 쪽에서 "부서 + 직급 + 유저" 조인으로 가져오는 게 좋음
        // 예: List<UserSimpleDTO> users = userMapper.selectActiveUsersWithDeptRank();
        // model.addAttribute("userList", users);

        model.addAttribute("scheduleId", scheduleId);
        model.addAttribute("schedule", schedule);
        return "schedule/invite"; // templates/schedule/invite.html
    }

    @PostMapping("/invite")
    public String inviteTeam(
            @RequestParam Long scheduleId,
            @RequestParam(required = false) List<Long> userIds
    ) {
        Long loginUserId = 1L; // 임시

        // 아무도 선택 안 하면 그냥 칸반으로
        if (userIds == null || userIds.isEmpty()) {
            return "redirect:/schedule/kanban";
        }

        // 본인(OWNER)이 체크되어 들어오는 경우 방지
        userIds.remove(loginUserId);

        // MEMBER 등록
        scheduleParticipantMapper.inviteTeam(scheduleId, userIds);

        return "redirect:/schedule/kanban";
    }

    @PostMapping("/inviteAjax")
    @ResponseBody
    public String inviteAjax(
            @RequestParam Long scheduleId,
            @RequestParam(required = false) List<Long> userIds
            //HttpSession session
    ) {
        // 로그인 사용자 id 가져오기 (임시)
        Long loginUserId =1L;

        if (scheduleId == null) return "NO_SCHEDULE";
        if (userIds == null || userIds.isEmpty()) return "OK";

        // 중복 방지: 본인(OWNER)은 MEMBER로 또 넣지 않게
        userIds.remove(loginUserId);

        // TEAM 멤버 삽입 (MyBatis mapper 호출)
        scheduleParticipantMapper.inviteTeam(scheduleId, userIds);

        return "OK";
    }

    @PostMapping("/createAjax")
    @ResponseBody
    public java.util.Map<String, Object> createAjax(
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

        Long loginUserId = 1L; // 임시 (create와 동일)
        dto.setCreatedBy(loginUserId);

        if ("PERSONAL".equalsIgnoreCase(type)) {
            dto.setInvitedBy(null);
        }

        scheduleMapper.insertSchedule(dto);
        Long scheduleId = dto.getScheduleId();

        // OWNER 등록
        scheduleParticipantMapper.inviteOwner(scheduleId, loginUserId);

        // COMPANY면 전원 등록
        if ("COMPANY".equalsIgnoreCase(type)) {
            scheduleParticipantMapper.inviteCompany(scheduleId, loginUserId);
        }

        // 선택 멤버는 /inviteAjax에서 추가로 등록

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("scheduleId", scheduleId);
        result.put("type", type);
        return result;
    }

    @GetMapping("/active-users")
    @ResponseBody
    public List<ScheduleInvitedDTO> activeUsers(@RequestParam Long scheduleId) {
        return scheduleInvitedMapper.selectActiveUsersExcludeOwner(scheduleId);
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
