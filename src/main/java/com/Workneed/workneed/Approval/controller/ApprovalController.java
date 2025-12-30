package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.dto.ApprovalTypeDTO;
import com.Workneed.workneed.Approval.dto.DocDTO;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.service.ApprovalService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Controller
@RequestMapping("/approval")
public class ApprovalController {

    private ApprovalService service;
    //생성자 주입
    public ApprovalController(ApprovalService service) {
        this.service = service;
    }



    //생성
    @GetMapping("/create")
    public String createForm(Model model, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return "redirect:/approval/login";

        List<ApprovalTypeDTO> types = service.getTypes();
        model.addAttribute("types", types);
        model.addAttribute("approverCandidates", service.getApproverCandidates());

        return "Approval/approval.create";
    }

    //저장

    @PostMapping("/save")
    public String save(@ModelAttribute DocDTO dto, HttpSession session){
        Long writerId = (Long) session.getAttribute("userId");
        if (writerId == null) return "redirect:/approval/login";

        dto.setWriterId(writerId);
        Long docId = service.save(dto);

        return "redirect:/approval/detail/" + docId;
    }

    @GetMapping("/detail/{docId}")
    public String detail(@PathVariable Long docId,
                         Model model,
                         HttpSession session) {

        ApprovalDoc doc = service.findById(docId);
        model.addAttribute("doc", doc);

        model.addAttribute("lines", service.findLinesByDocId(docId));
        model.addAttribute("files", service.getFilesByDocId(docId)); // 파일추가

        Long loginUserId = (Long) session.getAttribute("userId");

        boolean isWriter = (loginUserId != null && loginUserId.equals(doc.getWriterId()));
        model.addAttribute("isWriter", isWriter);

        boolean isMyTurn = (loginUserId != null) && service.isMyTurn(docId, loginUserId);
        model.addAttribute("isMyTurn", isMyTurn);

        return "Approval/approval.detail";
    }




    //제출

    @PostMapping("/submit")
    public String submit(@ModelAttribute DocDTO dto,
                         @RequestParam(required = false) List<MultipartFile> files,
                         @RequestParam("approverIds") List<Long> approverIds,
                         @RequestParam("orderNums") List<Integer> orderNums,
                         HttpSession session) throws Exception {

        Long writerId = (Long) session.getAttribute("userId");
        if (writerId == null) return "redirect:/approval/login";

        if (approverIds == null || approverIds.isEmpty()) {
            throw new IllegalStateException("결재자를 1명 이상 선택해야 합니다.");
        }
        if (orderNums == null || orderNums.size() != approverIds.size()) {
            throw new IllegalStateException("결재 차수 데이터가 올바르지 않습니다.");
        }

        // ✅ 1. docId 먼저 확보
        Long docId = dto.getDocId();
        if (docId == null) {
            dto.setWriterId(writerId);
            docId = service.save(dto);   // DRAFT 저장
        }

        // 그 다음 파일 저장
        if (files != null && !files.isEmpty()) {
            service.saveFile(docId, files);
        }



        // ✅ 3. 결재 흐름 시작
        service.submit(docId, approverIds, orderNums);

        System.out.println("SUBMIT sessionId=" + session.getId() + ", userId=" + session.getAttribute("userId"));

        return "redirect:/approval/detail/" + docId;
    }



    // 버튼


    @PostMapping("/reject")
    public String reject(@RequestParam("docId") Long docId,
                         @RequestParam("comment") String comment,
                         HttpSession session) {

        Long loginUserId = (Long) session.getAttribute("userId");
        if (loginUserId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        service.reject(docId, loginUserId, comment);

        return "redirect:/approval/detail/" + docId;
    }

    @PostMapping("/approve")
    public String approve(@RequestParam("docId") Long docId, HttpSession session) {

        Long loginUserId = (Long) session.getAttribute("userId");
        if (loginUserId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        service.approve(docId, loginUserId);

        return "redirect:/approval/detail/" + docId;
    }


/*
    @PostMapping("/recall")
    public String recall(@RequestParam("docId") Long docId){
        service.recall(docId); // 나중에 구현
        return "redirect:/approval/detail/" + docId;
    }
    */




}
