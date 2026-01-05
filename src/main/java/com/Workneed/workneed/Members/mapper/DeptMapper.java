package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.DeptDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.util.List;

@Mapper
public interface DeptMapper {
    List<DeptDTO> findAll();
    DeptDTO findById(Long deptId);
    void insertDept(DeptDTO deptDto);

    // 여기도 @Param을 추가합니다.
    void deleteDept(@Param("deptId") Long deptId);
}
