package com.Workneed.workneed.Calendar.mapper;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import com.Workneed.workneed.Calendar.dto.CalendarEventDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CalendarMapper {

    List<CalendarDTO> findAll();

    CalendarDTO findById(Long calendarId);

    void insert(CalendarDTO dto);

    void update(CalendarDTO dto);

    void delete(Long calendarId);

    //Schedule 연동
    List<CalendarEventDTO> findScheduleEventsForCalendar(Long userId);

}
