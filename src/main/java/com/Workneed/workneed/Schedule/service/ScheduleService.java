package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Schedule.mapper.ScheduleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleMapper scheduleMapper;

    public Map<String, Object> getLinks(Long scheduleId) {
        return scheduleMapper.selectScheduleLinks(scheduleId);
    }

    public void updateGitUrl(Long scheduleId, String gitUrl) {
        scheduleMapper.updateGitUrl(scheduleId, gitUrl);
    }

    public void updateFileStorageUrl(Long scheduleId, String fileStorageUrl) {
        scheduleMapper.updateFileStorageUrl(scheduleId, fileStorageUrl);
    }

    public void deleteGitUrl(Long scheduleId) {
        scheduleMapper.deleteGitUrl(scheduleId);
    }

    public void deleteFileStorageUrl(Long scheduleId) {
        scheduleMapper.deleteFileStorageUrl(scheduleId);
    }
}
