package com.Workneed.workneed.Calendar.controller;


import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/calendar")
public class CalendarController {

    private final CalendarService service;

    @GetMapping
    public String calendarMain() {
        return "Calendar/calendar";
    }

    @ResponseBody
    @GetMapping("/list")
    public List<CalendarDTO> list() {
        return service.findAll();
    }

    @ResponseBody
    @PostMapping("/add")
    public String add(@RequestBody CalendarDTO dto) {
        service.insert(dto);
        return "OK";
    }

    @ResponseBody
    @GetMapping("/{id}")
    public CalendarDTO detail(@PathVariable Long id) {
        return service.findById(id);
    }
}
