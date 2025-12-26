package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.ScheduleDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScheduleMapper {

    int insertSchedule(ScheduleDTO dto);

    int updateStatus(@Param("scheduleId") Long scheduleId,
                     @Param("status") String status);

    List<ScheduleDTO> selectByStatus(String status);

    ScheduleDTO selectById(Long scheduleId);

    List<ScheduleDTO> selectAll();
}