package com.Workneed.workneed.Chat.controller;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import com.Workneed.workneed.Chat.service.FileLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/chat/files")
@RequiredArgsConstructor
public class FileLogController {

    private final FileLogService fileLogService;

    @PostMapping("/upload")
    public ResponseEntity<FileLogDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") Long roomId) {

        // 파일 저장 로직 실행
        FileLogDTO result = fileLogService.saveFile(file, roomId);

        return ResponseEntity.ok(result);
    }
}
