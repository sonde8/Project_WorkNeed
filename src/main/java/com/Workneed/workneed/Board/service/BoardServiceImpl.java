package com.Workneed.workneed.Board.service;

import com.Workneed.workneed.Board.dto.BoardCategoryDTO;
import com.Workneed.workneed.Board.dto.BoardPostDTO;
import com.Workneed.workneed.Board.mapper.BoardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {

    private final BoardMapper boardMapper;

    // 1. 카테고리 목록 조회
    @Override
    public List<BoardCategoryDTO> getCategoryList() {
        return boardMapper.selectCategoryList();
    }

    // 2. 게시글 전체 목록 조회
    @Override
    public List<BoardPostDTO> getPostList() {
        return boardMapper.selectPostList();
    }

    // 3. 게시글 상세 조회
    @Override
    public BoardPostDTO getPostById(Long postId) {
        return boardMapper.selectPostById(postId);
    }

    // 4. 게시글 등록 (성공하면 true)
    @Override
    @Transactional
    public boolean registerPost(BoardPostDTO postDTO) {
        return boardMapper.insertPost(postDTO) == 1;
    }

    //5. 게시물 삭제
    @Override
    public boolean deletePost(Long postId, Long loginUserId, boolean isAdmin) {
        BoardPostDTO post = boardMapper.selectPostById(postId);
        if (post == null) return false;

        // admin이면 무조건 허용, 아니면 작성자만 허용
        if (!isAdmin) {
            if (loginUserId == null || post.getWriterId() == null) return false;
            if (!loginUserId.equals(post.getWriterId())) return false;
        }

        return boardMapper.deletePostById(postId) == 1;
    }
}
