package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.RankDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.util.List;

@Mapper
public interface RankMapper {
    List<RankDTO> findAll();
    RankDTO findById(Long rankId);
    void insertRank(RankDTO rankDto);
    void deleteRank(@Param("rankId") Long rankId);
}