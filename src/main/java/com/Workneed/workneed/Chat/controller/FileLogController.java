package com.Workneed.workneed.Chat.controller;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import com.Workneed.workneed.Chat.service.FileLogService;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.util.IOUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/chat/files")
@RequiredArgsConstructor
public class FileLogController {

    private final FileLogService fileLogService;
    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @PostMapping("/upload")
    public ResponseEntity<FileLogDTO> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("roomId") Long roomId) {
        FileLogDTO result = fileLogService.saveFile(file, roomId);
        return ResponseEntity.ok(result);
    }

    // [수정] 리다이렉트 대신 S3 객체를 직접 반환하여 다운로드 강제화
    @GetMapping("/download/{fileLogId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileLogId) {
        try {
            // 1. DB에서 파일 정보 조회 (DTO 확인)
            FileLogDTO fileLog = fileLogService.getFileById(fileLogId);
            if (fileLog == null) return ResponseEntity.notFound().build();

            // 2. S3 Key(파일명) 추출 및 디코딩
            // DB의 storedName 필드에 '파일명'만 들어있다면 바로 사용하고, URL이라면 잘라냅니다.
            String storedName = fileLog.getStoredName();
            String key = (storedName != null && storedName.contains("/"))
                    ? storedName.substring(storedName.lastIndexOf("/") + 1)
                    : storedName;

            // ★ S3 서버는 % 인코딩이 아닌 실제 문자(한글/공백)를 키로 사용합니다.
            key = URLDecoder.decode(key, StandardCharsets.UTF_8);
            System.out.println("S3 요청 최종 Key: " + key);

            // 3. S3에서 파일 데이터 가져오기
            S3Object s3Object = amazonS3.getObject(bucket, key);
            S3ObjectInputStream inputStream = s3Object.getObjectContent();
            byte[] bytes = IOUtils.toByteArray(inputStream);

            // 4. 다운로드 파일명 설정 (DB의 origin_name 활용)
            // 스크린샷에 나온 인코딩 문자열이 아니라, DB에 저장된 실제 원본 이름을 사용합니다.
            String originalName = fileLog.getFileName(); // FileLogDTO의 origin_name 매핑 확인
            String encodedFileName = URLEncoder.encode(originalName, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            // 5. 응답 생성 (강제 다운로드 헤더)
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .body(bytes);

        } catch (AmazonS3Exception e) {
            // S3에 파일이 없을 경우 (NoSuchKey)
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}