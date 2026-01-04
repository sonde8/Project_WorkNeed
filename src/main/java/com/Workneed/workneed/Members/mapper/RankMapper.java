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

    // @Param을 붙여서 XML의 #{rankId}와 이름을 강제로 연결합니다.
    void deleteRank(@Param("rankId") Long rankId);
}