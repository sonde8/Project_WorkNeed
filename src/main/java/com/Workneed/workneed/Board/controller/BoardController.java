package com.Workneed.workneed.Board.controller;


import com.Workneed.workneed.Board.dto.BoardCategoryDTO;
import com.Workneed.workneed.Board.dto.BoardPostDTO;
import com.Workneed.workneed.Board.service.BoardService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Enumeration;
import java.util.List;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // 1) 카테고리 목록
    @GetMapping("/categories")
    public ResponseEntity<List<BoardCategoryDTO>> categories() {
        return ResponseEntity.ok(boardService.getCategoryList());
    }

    // 2) 게시글 전체 목록
    @GetMapping("/posts")
    public ResponseEntity<List<BoardPostDTO>> posts() {
        return ResponseEntity.ok(boardService.getPostList());
    }

    // 3) 게시글 상세
    @GetMapping("/posts/{postId}")
    public ResponseEntity<BoardPostDTO> postDetail(@PathVariable Long postId) {
        return ResponseEntity.ok(boardService.getPostById(postId));
    }

    // 4) 게시글 등록
    private Long getLoginUserId(HttpSession session) {

        Object userObj = session.getAttribute("user");
        if (userObj != null) {
            com.Workneed.workneed.Members.dto.UserDTO user =
                    (com.Workneed.workneed.Members.dto.UserDTO) userObj;
            return user.getUserId();
        }

        Object adminObj = session.getAttribute("admin");
        if (adminObj != null) {
            com.Workneed.workneed.Members.dto.UserDTO admin =
                    (com.Workneed.workneed.Members.dto.UserDTO) adminObj;
            return admin.getUserId();
        }

        return null;
    }

    @PostMapping("/posts")
    public ResponseEntity<?> create(@RequestBody BoardPostDTO dto, HttpSession session) {
        Long loginUserId = getLoginUserId(session);

        dto.setWriterId(loginUserId);

        boolean ok = boardService.registerPost(dto);
        return ok ? ResponseEntity.ok().build()
                : ResponseEntity.badRequest().body("insert failed");
    }

    // 게시물 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> delete(@PathVariable Long postId, HttpSession session) {

        boolean isAdmin = session.getAttribute("admin") != null;

        Long loginUserId = null;
        Object userObj = session.getAttribute("user");
        if (userObj != null) {
            com.Workneed.workneed.Members.dto.UserDTO u =
                    (com.Workneed.workneed.Members.dto.UserDTO) userObj;
            loginUserId = u.getUserId();
        } else if (isAdmin) {
            Object adminObj = session.getAttribute("admin");
            com.Workneed.workneed.Members.dto.UserDTO a =
                    (com.Workneed.workneed.Members.dto.UserDTO) adminObj;
            loginUserId = a.getUserId();
        }

        boolean ok = boardService.deletePost(postId, loginUserId, isAdmin);

        if (!ok) return ResponseEntity.status(403).body("삭제 권한이 없습니다.");

        return ResponseEntity.noContent().build();
    }
}
