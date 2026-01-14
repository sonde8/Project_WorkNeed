package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Chat.service.StorageService;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;


// 사용자가 업로드한 프로필 사진 s3보관 , 주소를 db와 세션에 즉시 동기화시킨다
@Slf4j
@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    // s3로 변경을 위한 서비스 주입
    private final StorageService storageService;

     // 프로필 이미지 업로드 처리
    @PostMapping("/user/uploadProfile")
    @ResponseBody
    public ResponseEntity<String> uploadProfile(@RequestParam("profileFile") MultipartFile file,
                                        HttpSession session) {

        // 1. 세션에서 로그인 유저 정보 가져오기
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (!file.isEmpty()) {
            // 이미지 파일 여부 체크 (보안 강화)
            if (file.getContentType() == null || !file.getContentType().startsWith("image")) {
                log.warn("이미지 파일이 아닙니다: {}", file.getContentType());
                return ResponseEntity.badRequest().body("이미지 파일만 업로드 가능합니다.");
            }

            try {
                // 2. 파일 저장 물리 경로 설정 (상대 경로 기준)
                String s3Url = storageService.store(file, "profile");
                log.info("S3 프로필 업로드 완료: {}", s3Url);

                // 3. DB 업데이트
                userService.updateProfileImage(user.getUserId(), s3Url);

                // 4. 세션 갱신
                user.setUserProfileImage(s3Url);
                session.setAttribute("user", user);

                // 성공 시 새로운 URL 반환
                return ResponseEntity.status(HttpStatus.OK).header("Content-Type", "text/plain; charset=utf-8").body(s3Url);

            } catch (Exception e) {
                log.error("파일 저장 중 에러 발생", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류가 발생했습니다.");
            }
        }

        return ResponseEntity.badRequest().body("파일이 비어있습니다.");
    }
}