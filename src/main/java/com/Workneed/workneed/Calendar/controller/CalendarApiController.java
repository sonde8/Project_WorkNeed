package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;
import com.Workneed.workneed.Calendar.service.CalendarService;
import com.Workneed.workneed.config.CustomUserDetails; // ★ 필수 Import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/calendar")
public class CalendarApiController {

    private final CalendarService calendarService;

    // 1. 조회: 로그인한 사람의 ID를 서비스로 전달
    @GetMapping
    public List<CalendarDTO> getAll(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserDto() == null) return List.of();

        Long userId = userDetails.getUserDto().getUserId();
        return calendarService.getAll(userId);
    }

    // 2. 단건 조회
    @GetMapping("/{id}")
    public CalendarDTO get(@PathVariable Long id) {
        return calendarService.get(id);
    }

    // 3. 등록: 작성자를 현재 로그인한 사람으로 고정
    @PostMapping
    public void create(@RequestBody CalendarDTO dto,
                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUserDto() != null) {
            Long userId = userDetails.getUserDto().getUserId();
            dto.setCreatedBy(userId);
            calendarService.create(dto);
        }
    }

    // 4. 수정
    @PutMapping("/{id}")
    public void update(@PathVariable Long id, @RequestBody CalendarDTO dto,
                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        dto.setCalendarId(id);
        if (userDetails != null && userDetails.getUserDto() != null) {
            dto.setCreatedBy(userDetails.getUserDto().getUserId());
        }
        calendarService.update(dto);
    }

    // 5. 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        calendarService.delete(id);
    }

    // 6. 업무 연동 조회: 내가 포함된 업무만
    @GetMapping("/schedules")
    public List<CalendarEventDTO> getScheduleEvents(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserDto() == null) return List.of();

        Long userId = userDetails.getUserDto().getUserId();
        return calendarService.getScheduleEvents(userId);
    }
}