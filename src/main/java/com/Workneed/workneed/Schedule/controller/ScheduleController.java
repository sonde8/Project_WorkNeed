package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Schedule.dto.*;
import com.Workneed.workneed.Schedule.mapper.ScheduleInvitedMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import com.Workneed.workneed.Schedule.mapper.ScheduleParticipantMapper;
import com.Workneed.workneed.Schedule.mapper.TaskCommentMapper;
import com.Workneed.workneed.Schedule.service.ScheduleParticipantService;
import com.Workneed.workneed.Schedule.service.ScheduleService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@RequestMapping("/schedule")
public class ScheduleController {

    private final ScheduleMapper scheduleMapper;
    private final ScheduleParticipantMapper scheduleParticipantMapper;
    private final ScheduleInvitedMapper scheduleInvitedMapper;
    private final TaskCommentMapper taskCommentMapper;

    private final ScheduleParticipantService scheduleParticipantService;
    private final ScheduleService scheduleService;

    private final com.Workneed.workneed.Meetingroom.mapper.MeetingRoomMapper meetingRoomMapper;


    private Long getLoginUserId(HttpSession session) {
        Object u = session.getAttribute("user");
        if (!(u instanceof UserDTO)) return null;
        return ((UserDTO) u).getUserId();
    }

////칸반
    @GetMapping("/kanban")
    public String kanban(HttpSession session, Model model) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        List<ScheduleDTO> todoList  = scheduleMapper.selectVisibleByStatus("TODO",  loginUserId);
        List<ScheduleDTO> doingList = scheduleMapper.selectVisibleByStatus("DOING", loginUserId);
        List<ScheduleDTO> doneList  = scheduleMapper.selectVisibleByStatus("DONE",  loginUserId);

        model.addAttribute("todoList", todoList);
        model.addAttribute("doingList", doingList);
        model.addAttribute("doneList", doneList);

        return "Schedule/kanban";
    }

////테스크 생성
    @PostMapping("/create")
    public String create(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String status,
            @RequestParam String eventType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime startAt,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime endAt,
            HttpSession session
    ) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        ScheduleDTO dto = new ScheduleDTO();
        dto.setTitle(title);
        dto.setDescription(description);
        dto.setStatus(status);
        dto.setEventType(eventType);
        dto.setLocation(location);
        dto.setType(type);
        dto.setCreatedBy(loginUserId);
        dto.setStartAt(startAt);
        dto.setEndAt(endAt);

        if ("PERSONAL".equalsIgnoreCase(type)) {
            dto.setInvitedBy(null);
        }

        // schedule 저장
        scheduleMapper.insertSchedule(dto);
        Long scheduleId = dto.getScheduleId();

        // OWNER 등록
        scheduleParticipantMapper.inviteOwner(scheduleId, loginUserId);

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
////테스크 삭제
    @PostMapping("/delete")
    @ResponseBody
    public Map<String, Object> deleteSchedules(
            @RequestBody ScheduleDeleteDTO dto,
            HttpSession session
    ) {
        Map<String, Object> r = new HashMap<>();

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null){
            r.put("ok", false);
            r.put("message", "NO_LOGIN");
            return r;
        }
        List<Long> ids = dto.getScheduleIds();
        if (ids == null || ids.isEmpty()) {
            r.put("ok", false);
            r.put("message", "NO_IDS");
            return r;
        }

        try {
            // 옵션 A: 참여자 체크 + 진짜 삭제
            scheduleService.deleteSchedules(ids, loginUserId);

            r.put("ok", true);
            r.put("deletedIds", ids);
            return r;

        } catch (RuntimeException ex) {
            r.put("ok", false);
            r.put("message", ex.getMessage()); // DELETE_PERMISSION_DENIED 등
            return r;
        }

    }

////팀원 초대
    @GetMapping("/invite")
    public String invitePage(@RequestParam Long scheduleId,HttpSession session, Model model) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        // schedule 존재 확인
        ScheduleDTO schedule = scheduleMapper.selectById(scheduleId);
        if (schedule == null) return "redirect:/schedule/kanban";

        model.addAttribute("scheduleId", scheduleId);
        model.addAttribute("schedule", schedule);
        return "Schedule/invite";
    }

    @PostMapping("/invite")
    public String inviteTeam(
            @RequestParam Long scheduleId,
            @RequestParam(required = false) List<Long> userIds,
            HttpSession session
    ) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        if (userIds == null || userIds.isEmpty()) {
            return "redirect:/schedule/kanban";
        }

        // 본인(OWNER) 체크  방지
        userIds.remove(loginUserId);

        // MEMBER 등록
        scheduleParticipantMapper.inviteTeam(scheduleId, userIds);

        return "redirect:/schedule/kanban";
    }

////invite Ajax
    @PostMapping("/inviteAjax")
    @ResponseBody
    public String inviteAjax(
            @RequestParam Long scheduleId,
            @RequestParam(required = false) List<Long> userIds,
            HttpSession session
    ) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "NO_LOGIN";
        if (scheduleId == null) return "NO_SCHEDULE";
        if (userIds == null || userIds.isEmpty()) return "OK";

        // OWNER은 MEMBER로 방지
        userIds.remove(loginUserId);

        // TEAM 멤버
        scheduleParticipantMapper.inviteTeam(scheduleId, userIds);
        return "OK";
    }
////create Ajax
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
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime endAt,
            HttpSession session
    ) {
        Long loginUserId = getLoginUserId(session);
        Map<String, Object> result = new HashMap<>();
        if (loginUserId == null) {
            result.put("ok", false);
            result.put("code", "NO_LOGIN");
            return result;
        }
        ScheduleDTO dto = new ScheduleDTO();
        dto.setTitle(title);
        dto.setDescription(description);
        dto.setStatus(status);
        dto.setEventType(eventType);
        dto.setLocation(location);
        dto.setType(type);
        dto.setCreatedBy(loginUserId);
        dto.setStartAt(startAt);
        dto.setEndAt(endAt);


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

        result.put("ok", true);
        result.put("scheduleId", scheduleId);
        result.put("type", type);
        return result;
    }
////ACTIVE USERS
    @GetMapping("/active-users")
    @ResponseBody
    public List<ScheduleInvitedDTO> activeUsers(@RequestParam Long scheduleId,HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return List.of();
        return scheduleInvitedMapper.selectActiveUsersExcludeOwner(scheduleId);
    }

////STATUS UPDATE
    @PostMapping("/status")
    @ResponseBody
    public String updateStatus(@RequestParam Long scheduleId,
                               @RequestParam String status,
                               HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "NO_LOGIN";

        scheduleMapper.updateStatus(scheduleId, status);
        return "OK";
    }
////TASK DETAIL
    @GetMapping("/task")
    public String task(@RequestParam Long scheduleId, HttpSession session, Model model) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        ScheduleDTO schedule = scheduleMapper.selectById(scheduleId);
        if (schedule == null) return "redirect:/schedule/kanban";

        //미팅룸 조회
        String roomName = meetingRoomMapper.selectRoomNameByScheduleId(scheduleId);
        model.addAttribute("roomName", roomName);


        //댓글 조회
        List<TaskCommentDTO> commentList = taskCommentMapper.selectByScheduleId(scheduleId);

        model.addAttribute("schedule", schedule);
        model.addAttribute("commentList", commentList);

        return "Schedule/task";
    }

    /* Git 수정 */
    @PostMapping("/{id}/git/update")
    public String updateGit(@PathVariable Long id,
                            @RequestParam String gitUrl,
                            HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        scheduleService.updateGitUrl(id, gitUrl);
        return "redirect:/schedule/task?scheduleId=" + id;
    }

    /* Git 삭제 */
    @PostMapping("/{id}/git/delete")
    public String deleteGit(@PathVariable Long id, HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        scheduleService.deleteGitUrl(id);
        return "redirect:/schedule/task?scheduleId=" + id;
    }

    /* File Storage 수정 */
    @PostMapping("/{id}/file/update")
    public String updateFile(@PathVariable Long id,
                             @RequestParam String fileStorageUrl,
                             HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        scheduleService.updateFileStorageUrl(id, fileStorageUrl);
        return "redirect:/schedule/task?scheduleId=" + id;
    }

    /* File Storage 삭제 */
    @PostMapping("/{id}/file/delete")
    public String deleteFile(@PathVariable Long id,
                             HttpSession session) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return "redirect:/login";

        scheduleService.deleteFileStorageUrl(id);
        return "redirect:/schedule/task?scheduleId=" + id;
    }


    @GetMapping("/{id}/participants")
    @ResponseBody
    public ScheduleParticipantDTO getParticipants(@PathVariable Long id,
                                                  HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return null;

        return scheduleParticipantService.getParticipants(id);
    }

}
