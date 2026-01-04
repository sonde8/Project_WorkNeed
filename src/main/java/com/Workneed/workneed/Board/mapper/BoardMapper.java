package com.Workneed.workneed.Board.mapper;

import com.Workneed.workneed.Board.dto.BoardCategoryDTO;
import com.Workneed.workneed.Board.dto.BoardPostDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface BoardMapper {
    // 1. 카테고리 목록 조회
    List<BoardCategoryDTO> selectCategoryList();

    // 2. 게시글 전체 목록 조회
    List<BoardPostDTO> selectPostList();

    // 3. 게시글 상세 조회
    BoardPostDTO selectPostById(Long postId);

    // 4. 게시글 등록
    int insertPost(BoardPostDTO postDTO);
}
