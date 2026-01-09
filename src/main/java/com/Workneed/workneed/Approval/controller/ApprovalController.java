package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.dto.ApprovalDocListItemDTO;
import com.Workneed.workneed.Approval.dto.ApprovalSidebarCountDTO;
import com.Workneed.workneed.Approval.dto.ApprovalTypeDTO;
import com.Workneed.workneed.Approval.dto.DocDTO;
import com.Workneed.workneed.Approval.dto.DocFileDTO;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import com.Workneed.workneed.Approval.service.ApprovalService;
import com.Workneed.workneed.Chat.service.StorageService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Controller
@RequestMapping("/approval")
public class ApprovalController {

    private final ApprovalService service;
    // ✅ 파일 메타 조회/삭제는 Mapper로 직접 처리 (서비스 수정 없이 최소 기능)
    private final DocMapper docMapper;
    // S3 삭제 기능 등을 위해 주입
    private final StorageService storageService;

    public ApprovalController(ApprovalService service, DocMapper docMapper, StorageService storageService) {
        this.service = service;
        this.docMapper = docMapper;
        this.storageService = storageService;
    }
   /* ==========================================================
       공통 세션 유틸 (유저 파트 기준)
       ========================================================== */

    private UserDTO getLoginUser(HttpSession session) {
        return (UserDTO) session.getAttribute("user"); // ✅ UserDTO
    }

    private Long getLoginUserId(HttpSession session) {
        UserDTO user = getLoginUser(session);
        return (user == null) ? null : user.getUserId();
    }

    private String redirectLogin() {
        // ✅ 성욱님 프로젝트는 /login 쓰고 있으니 통일
        return "redirect:/login";
    }


    /* ==========================================================
       전자결재 진입 (관문)
       ========================================================== */

    // ✅ /approval 들어오면 기본: 처리 대기함으로 이동
    @GetMapping("")
    public String entry(HttpSession session) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        return "redirect:/approval/inbox/waiting";
    }

    /* ==========================================================
       ✅ 사이드바 카운트 공통 주입
       ========================================================== */

    @ModelAttribute("counts")
    public ApprovalSidebarCountDTO counts(HttpSession session) {
        Long userId = getLoginUserId(session); // ✅ userId 키 말고 UserDTO에서 꺼냄
        if (userId == null) {
            return new ApprovalSidebarCountDTO(); // 세션 없으면 0
        }
        return service.getCounts(userId);
    }

    /* ==========================================================
       문서 생성 화면
       ========================================================== */

    @GetMapping("/create")
    public String createForm(Model model, HttpSession session) {

        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        // 문서 유형 리스트
        List<ApprovalTypeDTO> types = service.getTypes();
        model.addAttribute("types", types);

        model.addAttribute("approvers", service.getApproverCandidates());

        return "Approval/approval.create";
    }

    /* ==========================================================
       임시저장
       ========================================================== */

    @PostMapping("/save")
    public String save(@ModelAttribute DocDTO dto, HttpSession session) {

        Long writerId = getLoginUserId(session);
        if (writerId == null) return redirectLogin();

        dto.setWriterId(writerId);
        Long docId = service.save(dto);

        return "redirect:/approval/detail/" + docId;
    }

    /* ==========================================================
       상세 페이지
       ========================================================== */

    @GetMapping("/detail/{docId}")
    public String detail(@PathVariable Long docId,
                         Model model,
                         HttpSession session) {

        ApprovalDoc doc = service.findById(docId);
        if (doc == null) {
            model.addAttribute("doc", null);
            model.addAttribute("lines", List.of());
            model.addAttribute("files", List.of());
            return "Approval/approval.detail";
        }

        model.addAttribute("doc", doc);
        model.addAttribute("lines", service.findLinesByDocId(docId));
        model.addAttribute("refUsers", service.findRefUsersByDocId(docId));
        model.addAttribute("files", service.getFilesByDocId(docId)); // ✅ 파일 목록은 기존 service 그대로 사용

        Long loginUserId = getLoginUserId(session);

        boolean isWriter = (loginUserId != null && loginUserId.equals(doc.getWriterId()));
        model.addAttribute("isWriter", isWriter);

        boolean isMyTurn = (loginUserId != null) && service.isMyTurn(docId, loginUserId);
        model.addAttribute("isMyTurn", isMyTurn);

        boolean isReference = service.isReferenceUser(doc.getRefUserIds(), loginUserId);
        model.addAttribute("isReference", isReference);


        return "Approval/approval.detail";
    }

    /* ==========================================================
       상신 (문서 저장 + 파일 업로드 + 결재선 생성)
       ========================================================== */

    @PostMapping("/submit")
    public String submit(@ModelAttribute DocDTO dto,
                         HttpServletRequest request,
                         @RequestParam(required = false) List<MultipartFile> files,
                         @RequestParam(required = false, name = "approverIds") List<Long> approverIds,
                         @RequestParam(required = false, name = "orderNums") List<Integer> orderNums,
                         @RequestParam(required = false, name = "referenceIds") List<Long> referenceIds,
                         HttpSession session) throws Exception {

        System.out.println("REQ typeId=" + request.getParameter("typeId"));
        System.out.println("DTO typeId=" + dto.getTypeId());

        Long writerId = getLoginUserId(session);
        if (writerId == null) return redirectLogin();

        if (approverIds == null || approverIds.isEmpty()) {
            throw new IllegalStateException("결재자를 1명 이상 선택해야 합니다.");
        }
        if (orderNums == null || orderNums.size() != approverIds.size()) {
            throw new IllegalStateException("결재 차수 데이터가 올바르지 않습니다.");
        }

        // 문서 저장(없으면 생성)
        Long docId = dto.getDocId();
        if (docId == null) {
            dto.setWriterId(writerId);
            docId = service.save(dto);
        }

        // ✅ 파일 저장(업로드) 호출 추가 (이 부분이 누락되어 있었습니다)
        if (files != null && !files.isEmpty()) {
            System.out.println("전송된 파일 저장 시작: " + files.size());
            service.saveFile(docId, files); // 👈 서비스의 saveFile 호출
        }

        // 결재 흐름 시작
        service.submit(docId, approverIds, orderNums, referenceIds);

        return "redirect:/approval/detail/" + docId;
    }

    /* ==========================================================
       파일: 다운로드 / 삭제 (✅ 최소 기능, 서비스 수정 없음)
       - 다운로드: GET  /approval/file/{fileId}/download
       - 삭제    : POST /approval/file/{fileId}/delete
       ========================================================== */

    // 다운로드
    @GetMapping("/file/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId, HttpSession session) {
        try {
            // 1. 세션 확인 및 파일 정보 조회
            Long loginUserId = getLoginUserId(session);
            if (loginUserId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            DocFileDTO file = docMapper.selectFileById(fileId);
            if (file == null) return ResponseEntity.notFound().build();

            // 2. 권한 체크 (문서 작성자 또는 관련자 확인)
            ApprovalDoc doc = service.findById(file.getDocId());
            if (doc == null) return ResponseEntity.notFound().build();

            // 3. S3 URL을 리소스로 변환 (중요: java.net.URI 사용)
            Resource resource = new org.springframework.core.io.UrlResource(java.net.URI.create(file.getSavedName()));

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // 4. 파일명 한글 깨짐 방지 인코딩
            String originalName = (file.getOriginalName() != null) ? file.getOriginalName() : "file";
            String encoded = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            // 서버 콘솔에서 구체적인 에러 원인을 확인할 수 있도록 로그 출력
            System.err.println("다운로드 중 서버 에러 발생: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 삭제
    @PostMapping("file/{fileId}/delete")
    public String deleteFile(@PathVariable Long fileId, HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return redirectLogin();

        DocFileDTO file = docMapper.selectFileById(fileId);
        if (file == null) return "redirect:/approval/inbox/waiting";

        ApprovalDoc doc = service.findById(file.getDocId());
        if (doc == null || !loginUserId.equals(doc.getWriterId())) {
            throw new IllegalStateException("파일 삭제 권한이 없습니다.");
        }

        // S3 서버에서 삭제
        try {
            // savedName(S3 URL)을 이용해 S3에서 삭제 시도
            storageService.delete(file.getSavedName());
        } catch (Exception e) {
            // 삭제 실패 로그 기록 (흐름에는 지장 없게 처리 가능)
            System.err.println("S3 파일 삭제 실패: " + e.getMessage());
        }

        // 2️⃣ DB 메타 데이터 삭제
        docMapper.deleteFileById(fileId);

        return "redirect:/approval/detail/" + file.getDocId();
    }

    /* ==========================================================
       결재 처리
       ========================================================== */

    @PostMapping("/reject")
    public String reject(@RequestParam Long docId,
                         @RequestParam String comment,
                         HttpSession session) {
        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return redirectLogin();

        service.reject(docId, loginUserId, comment);
        return "redirect:/approval/detail/" + docId;
    }

    @PostMapping("/approve")
    public String approve(@RequestParam Long docId,
                          HttpSession session) {

        Long loginUserId = getLoginUserId(session);
        if (loginUserId == null) return redirectLogin();

        service.approve(docId, loginUserId);
        return "redirect:/approval/detail/" + docId;
    }

    /* ==========================================================
       수신함 (공통 템플릿 approval.inbox)
       ========================================================== */

    @GetMapping("/inbox/waiting")
    public String inboxWaiting(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "처리 대기");
        model.addAttribute("active", "waiting");
        model.addAttribute("list", service.getWaitingInbox(userId));
        return "Approval/approval.inbox";
    }

    @GetMapping("/inbox/done")
    public String inboxDone(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "처리 완료");
        model.addAttribute("active", "done");
        model.addAttribute("list", service.getDoneInbox(userId));
        return "Approval/approval.inbox";
    }

    /* ==========================================================
       내 문서함 (공통 템플릿 approval.inbox)
       ========================================================== */
/*
    @GetMapping("/my/all")
    public String myAll(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "전체");
        model.addAttribute("active", "myAll");
        model.addAttribute("list", service.getMyAllList(userId));
        return "Approval/approval.inbox";
    }
*/
    @GetMapping("/my/drafts")
    public String myDrafts(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "임시저장");
        model.addAttribute("active", "myDrafts");
        model.addAttribute("list", service.getMyDraftList(userId));
        return "Approval/approval.inbox";
    }

    @GetMapping("/my/in-progress")
    public String myInProgress(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "진행중");
        model.addAttribute("active", "myInProgress");
        model.addAttribute("list", service.getMyInProgressList(userId));
        return "Approval/approval.inbox";
    }

    @GetMapping("/my/approved")
    public String myApproved(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "승인됨");
        model.addAttribute("active", "myApproved");
        model.addAttribute("list", service.getMyApprovedList(userId));
        return "Approval/approval.inbox";
    }

    @GetMapping("/my/rejected")
    public String myRejected(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "반려됨");
        model.addAttribute("active", "myRejected");
        model.addAttribute("list", service.getMyRejectedList(userId));
        return "Approval/approval.inbox";
    }
    @GetMapping("/my/reference")
    public String myReference(HttpSession session, Model model) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("title", "참조됨");
        model.addAttribute("active", "myReference");
        model.addAttribute("list", service.getReferenceList(userId));
        return "Approval/approval.inbox";
    }
}