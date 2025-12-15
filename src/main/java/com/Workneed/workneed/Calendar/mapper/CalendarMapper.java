package com.Workneed.workneed.Calendar.mapper;

import com.Workneed.workneed.Calendar.dto.CalendarDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CalendarMapper {
    List<CalendarDTO> findAll();
    CalendarDTO findById(Long id);
    int insert(CalendarDTO dto);
    int update(CalendarDTO dto);
    int delete(Long id);
}
