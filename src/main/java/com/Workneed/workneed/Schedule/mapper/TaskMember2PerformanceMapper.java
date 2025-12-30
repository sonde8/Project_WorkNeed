package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.TaskMember2PerformanceDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskMember2PerformanceMapper {

    List<TaskMember2PerformanceDTO> selectTasksByStatus(
            @Param("scheduleId") Long scheduleId,
            @Param("userId") Long userId,
            @Param("status") String status
    );

    int countTasksByStatus(
            @Param("scheduleId") Long scheduleId,
            @Param("userId") Long userId,
            @Param("status") String status
    );

    int insertMemberTask(
            @Param("scheduleId") Long scheduleId,
            @Param("userId") Long userId,
            @Param("taskDescription") String taskDescription
    );


    int updateTaskStatus(@Param("taskId") Long taskId,
                         @Param("scheduleId") Long scheduleId,
                         @Param("userId") Long userId,
                         @Param("personalStatus") String personalStatus);
}