package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;
import com.Workneed.workneed.Calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/calendar")
public class CalendarApiController {

    private final CalendarService calendarService;

    // 전체 조회
    @GetMapping
    public List<CalendarDTO> getAll() {
        return calendarService.getAll();
    }

    // 단건 조회
    @GetMapping("/{id}")
    public CalendarDTO get(@PathVariable Long id) {
        return calendarService.get(id);
    }

    // 등록
    @PostMapping
    public void create(@RequestBody CalendarDTO dto) {
        calendarService.create(dto);
    }

    // 수정
    @PutMapping("/{id}")
    public void update(@PathVariable Long id, @RequestBody CalendarDTO dto) {
        dto.setCalendarId(id);
        calendarService.update(dto);
    }

    // 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        calendarService.delete(id);
    }

    //Schedule 연동
    @GetMapping("/schedules")
    public List<CalendarEventDTO> getScheduleEvents() {
        Long userId = 1L; // 테스트용
        return calendarService.getScheduleEvents(userId);
    }

}