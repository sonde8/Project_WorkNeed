package com.Workneed.workneed.Schedule.controller;

import com.Workneed.workneed.Chat.service.FileLogService;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Schedule.dto.ScheduleFileDTO;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.util.IOUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/task/files")
@RequiredArgsConstructor
public class TaskFileController {

    private final FileLogService fileLogService;
    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    /**
     * 업무 관련 파일 업로드
     */
    @PostMapping("/upload")
    public ResponseEntity<ScheduleFileDTO> upload(@RequestParam("file") MultipartFile file,
                                                  @RequestParam("scheduleId") Long scheduleId,
                                                  HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Service에서 S3 업로드 및 schedule_file 테이블 저장을 처리합니다.
        ScheduleFileDTO result = fileLogService.saveScheduleFile(file, scheduleId, user.getUserId());
        return ResponseEntity.ok(result);
    }

    /**
     * 업무 관련 파일 다운로드 (강제 다운로드 방식)
     */
    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> download(@PathVariable Long fileId) {
        try {
            // 1. DB에서 업무 파일 정보 조회
            ScheduleFileDTO fileLog = fileLogService.getScheduleFileById(fileId);
            if (fileLog == null) return ResponseEntity.notFound().build();

            // 2. S3 Key 추출 (중요: S3의 Key는 폴더 경로를 포함해야 합니다)
            String storedName = fileLog.getStoredName();

            // DB에 저장된 storedName이 파일명만 가지고 있다면 폴더명을 붙여줘야 합니다.
            // 로그상 파일들이 'task/' 폴더 안에 있으므로 경로를 맞춰줍니다.
            String key = storedName;
            if (key != null && !key.startsWith("task/")) {
                key = "task/" + key;
            }

            // S3 서버의 실제 Key와 매칭하기 위해 디코딩 수행 (인코딩된 한글/특수문자 처리)
            key = URLDecoder.decode(key, StandardCharsets.UTF_8);

            // 3. S3에서 파일 객체 가져오기
            // bucket 이름과 위에서 만든 key(task/uuid_파일명)를 사용하여 호출합니다.
            S3Object s3Object = amazonS3.getObject(bucket, key);
            S3ObjectInputStream inputStream = s3Object.getObjectContent();
            byte[] bytes = IOUtils.toByteArray(inputStream);

            // 4. 원본 파일명 인코딩 (브라우저 다운로드 창에서 원본 파일명을 보여주기 위함)
            String encodedFileName = URLEncoder.encode(fileLog.getOriginalName(), StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            // 5. HTTP 헤더 설정 및 데이터 전송
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename(encodedFileName)
                    .build());

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

        } catch (AmazonS3Exception e) {
            // S3에 파일이 없을 경우 (NoSuchKey, 404)
            System.err.println("S3에서 파일을 찾을 수 없습니다. 요청한 Key: " + e.getErrorCode());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}