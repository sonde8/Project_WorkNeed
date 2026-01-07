package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.ScheduleDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ScheduleMapper {

    int insertSchedule(ScheduleDTO dto);

    int updateStatus(@Param("scheduleId") Long scheduleId,
                     @Param("status") String status);

    List<ScheduleDTO> selectVisibleByStatus(@Param("status") String status,
                                     @Param("userId") Long userId);

    ScheduleDTO selectById(Long scheduleId);


    Map<String, Object> selectScheduleLinks(Long scheduleId);

    int deleteByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);

    int updateGitUrl(@Param("scheduleId") Long scheduleId,
                     @Param("gitUrl") String gitUrl);
    int deleteGitUrl(Long scheduleId);

    int updateFileStorageUrl(@Param("scheduleId") Long scheduleId,
                             @Param("fileStorageUrl") String fileStorageUrl);
    int deleteFileStorageUrl(Long scheduleId);

    List<ScheduleDTO> selectByStatusForMain(
            @Param("userId") Long userId,
            @Param("status") String status
    );
}