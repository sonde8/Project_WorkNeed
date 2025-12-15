package com.Workneed.workneed.Calendar.service;

import com.Workneed.workneed.Calendar.dto.ScheduleDTO;
import com.Workneed.workneed.Calendar.mapper.ScheduleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleMapper mapper;

    @Override
    public List<ScheduleDTO> findAll() {
        return mapper.findAll();
    }

    @Override
    public ScheduleDTO findById(Long id) {
        return mapper.findById(id);
    }

    @Override
    public void insert(ScheduleDTO dto) {
        mapper.insert(dto);
    }
}
