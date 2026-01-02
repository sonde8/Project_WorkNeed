package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;
import com.Workneed.workneed.Calendar.service.CalendarService;
import com.Workneed.workneed.Members.dto.UserDTO; // ★ UserDTO Import 필수
import jakarta.servlet.http.HttpSession; // ★ HttpSession Import 필수
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/calendar")
public class CalendarApiController {

    private final CalendarService calendarService;

    // 1. 조회
    @GetMapping
    public List<CalendarDTO> getAll(HttpSession session) {
        // 세션에서 user 꺼내기
        UserDTO user = (UserDTO) session.getAttribute("user");

        // 비로그인 상태면 빈 리스트 반환
        if (user == null) {
            return List.of();
        }

        return calendarService.getAll(user.getUserId());
    }

    // 2. 단건 조회
    @GetMapping("/{id}")
    public CalendarDTO get(@PathVariable Long id) {
        return calendarService.get(id);
    }

    // 3. 등록
    @PostMapping
    public void create(@RequestBody CalendarDTO dto, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user != null) {
            // 세션 ID로 작성자 강제 주입
            dto.setCreatedBy(user.getUserId());
            calendarService.create(dto);
        } else {
            log.warn("로그인되지 않은 사용자의 일정 등록 시도");
        }
    }

    // 4. 수정
    @PutMapping("/{id}")
    public void update(@PathVariable Long id,
                       @RequestBody CalendarDTO dto,
                       HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        dto.setCalendarId(id);

        if (user != null) {
            // 수정 시에도 작성자 정보 유지 (혹은 수정자 기록용)
            dto.setCreatedBy(user.getUserId());
            calendarService.update(dto);
        }
    }

    // 5. 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        calendarService.delete(id);
    }

    // 6. 업무 연동 조회
    @GetMapping("/schedules")
    public List<CalendarEventDTO> getScheduleEvents(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            return List.of();
        }

        return calendarService.getScheduleEvents(user.getUserId());
    }
}