package com.Workneed.workneed.Board.controller;


import com.Workneed.workneed.Board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    /*
    * 카테고리
    * 메인에 띄울 최신글 조회
    * 클릭 시 글 상세보기 모달 데이터 조회
    * 글 작성 모달 저장
    * */
}
