package com.Workneed.workneed.Chat.controller;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import com.Workneed.workneed.Chat.service.FileLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/chat/files")
@RequiredArgsConstructor
public class FileLogController {

    private final FileLogService fileLogService;

    // 파일 업로드 API
    @PostMapping("/upload")
    public ResponseEntity<FileLogDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") Long roomId) {

        // 파일 저장 로직 실행 (S3 업로드 및 DB 기록)
        FileLogDTO result = fileLogService.saveFile(file, roomId);
        return ResponseEntity.ok(result);
    }

    // 파일 다운로드 API (S3 URL로 리다이렉트)
    @GetMapping("/download/{fileLogId}")
    public ResponseEntity<Void> downloadFile(@PathVariable Long fileLogId) {
        // 1. DB에서 파일 정보 조회 (S3 URL이 포함됨)
        FileLogDTO fileLog = fileLogService.getFileById(fileLogId);

        // 2. HTTP 302(FOUND) 상태코드로 S3 주소 전달
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(fileLog.getFilePath()))
                .build();
    }
}