package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.entity.Rank;
import org.apache.ibatis.annotations.Mapper;


import java.util.List;

@Mapper
public interface RankMapper {

    List<Rank> findAll();

    Rank findById(Long rankId);

    void insertRank(Rank rank);

    void updateRank(Rank rank);

    void deleteRank(Long rankId);
}