package com.Workneed.workneed.Calendar.service;


import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.mapper.CalendarMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarMapper mapper;

    public List<CalendarDTO> findAll() {
        return mapper.findAll();
    }

    public CalendarDTO findById(Long id) {
        return mapper.findById(id);
    }

    public int insert(CalendarDTO dto) {
        return mapper.insert(dto);
    }
}
