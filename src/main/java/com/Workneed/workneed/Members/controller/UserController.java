package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // application.properties에서 file.upload-dir=uploads 값을 가져옵니다.
    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 프로필 이미지 업로드 처리
     */
    @PostMapping("/user/uploadProfile")
    public String uploadProfile(@RequestParam("profileFile") MultipartFile file,
                                HttpSession session) {

        // 1. 세션에서 로그인 유저 정보 가져오기
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            log.warn("로그인 세션이 만료되었습니다.");
            return "redirect:/login";
        }

        if (!file.isEmpty()) {
            // 이미지 파일 여부 체크 (보안 강화)
            if (file.getContentType() == null || !file.getContentType().startsWith("image")) {
                log.warn("이미지 파일만 업로드 가능합니다.");
                return "redirect:/main?error=notImage";
            }

            try {
                // 2. 파일 저장 물리 경로 설정 (상대 경로 기준)
                // 프로젝트루트/uploads/profiles/ 구조가 됩니다.
                String savePath = System.getProperty("user.dir") + File.separator + uploadDir + File.separator + "profiles" + File.separator;

                File dir = new File(savePath);
                if (!dir.exists()) {
                    dir.mkdirs(); // 폴더가 없으면 생성 (uploads와 profiles 폴더 모두 생성)
                    log.info("폴더를 생성했습니다: {}", savePath);
                }

                // 3. 파일명 중복 방지를 위한 UUID 생성
                String originalFileName = file.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String savedFileName = UUID.randomUUID().toString() + extension;

                // 4. 서버 PC에 파일 물리적 저장
                File saveFile = new File(savePath, savedFileName);
                file.transferTo(saveFile);
                log.info("파일 물리적 저장 완료: {}", saveFile.getAbsolutePath());

                // 5. DB에 저장할 웹 경로 문자열 (UserWebConfig의 /upload/** 매핑과 일치해야 함)
                String dbPath = "/upload/profiles/" + savedFileName;

                // 6. DB 업데이트 (Service를 거쳐 Mapper 실행)
                userService.updateProfileImage(user.getUserId(), dbPath);

                // 7. 세션 객체 정보 갱신 (메인 페이지에 즉시 반영되도록)
                user.setUserProfileImage(dbPath);
                session.setAttribute("user", user);

                log.info("프로필 업데이트 성공! DB 경로: {}", dbPath);

            } catch (IOException e) {
                log.error("파일 저장 중 에러 발생", e);
            }
        }

        return "redirect:/main";
    }
}