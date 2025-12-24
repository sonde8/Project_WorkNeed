package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.entity.Dept;
import org.apache.ibatis.annotations.Mapper;


import java.util.List;

@Mapper
public interface DeptMapper {

    List<Dept> findAll();

    Dept findById(Long deptId);

    void insertDept(Dept dept);

    void updateDept(Dept dept);

    void deleteDept(Long deptId);
}
