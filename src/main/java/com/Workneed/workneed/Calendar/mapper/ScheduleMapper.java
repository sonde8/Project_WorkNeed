package com.Workneed.workneed.Calendar.mapper;


import com.Workneed.workneed.Calendar.dto.ScheduleDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ScheduleMapper {
    List<ScheduleDTO> findAll();
    ScheduleDTO findById(Long id);
    int insert(ScheduleDTO dto);
    int update(ScheduleDTO dto);
    int delete(Long id);
}
