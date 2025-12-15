package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Calendar.dto.ScheduleDTO;
import com.Workneed.workneed.Calendar.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/schedule")
public class ScheduleController {

    private final ScheduleService service;

    @GetMapping("/list")
    public List<ScheduleDTO> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ScheduleDTO detail(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/add")
    public String add(@RequestBody ScheduleDTO dto) {
        service.insert(dto);
        return "OK";
    }
}
