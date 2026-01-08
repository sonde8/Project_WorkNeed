package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.ScheduleFileDTO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ScheduleFileMapper {

    // 1. 파일 저장
    int insertScheduleFile(ScheduleFileDTO scheduleFileDTO);

    // 2. 업무별 파일 목록 조회
    List<ScheduleFileDTO> findFilesByScheduleId(Long scheduleId);

    // 3. 다운로드용 단건 조회
    ScheduleFileDTO findFileById(Long fileId);

    // 4. 파일 삭제
    int deleteScheduleFile(Long fileId);

    // 5. 업무(schedule) 기준 파일 전체 삭제
    int deleteFilesByScheduleId(Long scheduleId);
}