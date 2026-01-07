package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.TaskCommentDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskCommentMapper {
    List<TaskCommentDTO> selectByScheduleId(@Param("scheduleId") Long scheduleId);

    int insertComment(TaskCommentDTO dto);

    int updateComment(@Param("commentId") Long commentId,
                      @Param("writerId") Long writerId,
                      @Param("content") String content);

    int deleteComment(@Param("commentId") Long commentId,
                      @Param("writerId") Long writerId);

    int deleteByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);
}

