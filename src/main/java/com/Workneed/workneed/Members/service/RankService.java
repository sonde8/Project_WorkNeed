package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.entity.Rank;
import com.Workneed.workneed.Members.mapper.RankMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RankService {

    private final RankMapper rankMapper;

    public List<Rank> getAllRanks() {
        return rankMapper.findAll();
    }

    public Rank getRank(Long rankId) {
        return rankMapper.findById(rankId);
    }

    public void createRank(Rank rank) {
        rankMapper.insertRank(rank);
    }

    public void updateRank(Rank rank) {
        rankMapper.updateRank(rank);
    }

    public void deleteRank(Long rankId) {
        rankMapper.deleteRank(rankId);
    }
}