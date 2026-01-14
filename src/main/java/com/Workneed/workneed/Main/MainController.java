package com.Workneed.workneed.Main;

import com.Workneed.workneed.Approval.service.ApprovalService;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class MainController {

    private final ApprovalService approvalService;
    private final ScheduleMapper scheduleMapper;

    // application.properties의 값을 주입받음
    @Value("${google.calendar.api-key}")
    private String googleCalendarApiKey;

    @GetMapping("/main")
    public String main(HttpSession session, Model model) {

        // 관리자라면 관리자 멤버리스트로 반환
        if (session.getAttribute("admin") != null) {
            return "redirect:/admin/member/list";
        }

        // 2. 로그인 안 했으면 로그인 페이지로
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        // 공통 모델 데이터 추가
        model.addAttribute("user", user);
        model.addAttribute("pageTitle", "메인");

// mini kanban

        Long userId = user.getUserId();

        model.addAttribute("counts", approvalService.getCounts(userId));

        model.addAttribute("doingScheduleCount", scheduleMapper.countMainDoingSchedules());

        model.addAttribute("mainTodo",
                scheduleMapper.selectMainMyTaskCardsInDoingScheduleByStatus(userId, "TODO"));

        model.addAttribute("mainDoing",
                scheduleMapper.selectMainMyTaskCardsInDoingScheduleByStatus(userId, "DOING"));

        model.addAttribute("googleCalendarApiKey", googleCalendarApiKey);

        return "Main/main";
    }

    @GetMapping("/debug")
    @ResponseBody
    public String debug(HttpSession session) {
        return session.getAttribute("user") == null
                ? "NO USER IN SESSION"
                : "USER IN SESSION";
    }

}
