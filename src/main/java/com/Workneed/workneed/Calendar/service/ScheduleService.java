package com.Workneed.workneed.Calendar.service;

import com.Workneed.workneed.Calendar.dto.ScheduleDTO;

import java.util.List;

public interface ScheduleService {

    List<ScheduleDTO> findAll();

    ScheduleDTO findById(Long id);

    void insert(ScheduleDTO dto);
}
