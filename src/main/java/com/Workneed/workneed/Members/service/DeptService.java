package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.DeptDTO;
import com.Workneed.workneed.Members.mapper.DeptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeptService {

    private final DeptMapper deptMapper;

    public List<DeptDTO> getAllDepts() {
        return deptMapper.findAll();
    }

    public DeptDTO getDept(Long deptId) {
        return deptMapper.findById(deptId);
    }

    public void createDept(DeptDTO dept) {
        deptMapper.insertDept(dept);
    }

    public void updateDept(DeptDTO dept) {
        deptMapper.updateDept(dept);
    }

    public void deleteDept(Long deptId) {
        deptMapper.deleteDept(deptId);
    }
}
