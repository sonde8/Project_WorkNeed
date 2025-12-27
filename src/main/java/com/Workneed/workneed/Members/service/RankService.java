package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.RankDTO;
import com.Workneed.workneed.Members.mapper.RankMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RankService {

    private final RankMapper rankMapper;

    public List<RankDTO> getAllRanks() {
        return rankMapper.findAll();
    }

    public RankDTO getRank(Long rankId) {
        return rankMapper.findById(rankId);
    }

    public void createRank(RankDTO rank) {
        rankMapper.insertRank(rank);
    }

    public void updateRank(RankDTO rank) {
        rankMapper.updateRank(rank);
    }

    public void deleteRank(Long rankId) {
        rankMapper.deleteRank(rankId);
    }
}