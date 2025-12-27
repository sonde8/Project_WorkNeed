package com.Workneed.workneed.Calendar.service;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;
import com.Workneed.workneed.Calendar.mapper.CalendarMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {

    private final CalendarMapper calendarMapper;

    @Override
    public List<CalendarDTO> getAll() {
        return calendarMapper.findAll();
    }

    @Override
    public CalendarDTO get(Long calendarId) {
        return calendarMapper.findById(calendarId);
    }

    @Override
    public void create(CalendarDTO dto) {
        calendarMapper.insert(dto);
    }

    @Override
    public void update(CalendarDTO dto) {
        calendarMapper.update(dto);
    }

    @Override
    public void delete(Long calendarId) {
        calendarMapper.delete(calendarId);
    }

    //Schedule 연동
    @Override
    public List<CalendarEventDTO> getScheduleEvents(Long userId) {
        return calendarMapper.findScheduleEventsForCalendar(userId);
    }

}
