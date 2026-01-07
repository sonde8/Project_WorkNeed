package com.Workneed.workneed.Board.service;

import com.Workneed.workneed.Board.dto.BoardCategoryDTO;
import com.Workneed.workneed.Board.dto.BoardPostDTO;

import java.util.List;

public interface BoardService {
    // 1. 카테고리 목록 조회
    List<BoardCategoryDTO> getCategoryList();

    // 2. 게시글 전체 목록 조회
    List<BoardPostDTO> getPostList();

    // 3. 게시글 상세 조회
    BoardPostDTO getPostById(Long postId);

    // 4. 게시글 등록 (성공하면 true)
    boolean registerPost(BoardPostDTO postDTO);

    // 5. 게시물 삭제
    boolean deletePost(Long postId, Long loginUserId, boolean isAdmin);

}
