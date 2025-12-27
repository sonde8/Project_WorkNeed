package com.Workneed.workneed.Calendar.service;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;

import java.util.List;

public interface CalendarService {

    List<CalendarDTO> getAll();

    CalendarDTO get(Long calendarId);

    void create(CalendarDTO dto);

    void update(CalendarDTO dto);

    void delete(Long calendarId);

    //Schedule 연동
    List<CalendarEventDTO> getScheduleEvents(Long userId);

}
