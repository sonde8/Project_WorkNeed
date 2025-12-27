package com.Workneed.workneed.Chat.service;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import com.Workneed.workneed.Chat.mapper.FileLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FileLogService {

    private final StorageService storageService;
    private final FileLogMapper fileLogMapper;

    @Transactional
    public FileLogDTO saveFile(MultipartFile file, Long roomId) {
        // 원본 파일명 가져오기
        String originalFilename = file.getOriginalFilename();

        // 1. 물리적 저장 실행 (LocalStorageService.store 호출)
        // 저장된 후 UUID가 포함된 storedName을 반환 받음
        String storedName = storageService.store(file);

        // 2. 파일 타입 변환 (단순 확장자 체크)
        String contentType = file.getContentType();
        String fileType = (contentType != null && contentType.startsWith("image")) ? "IMAGE" : "FILE";

        // 3. DB에 저장할 DTO
        FileLogDTO fileLog = FileLogDTO.builder()
                .roomId(roomId)
                .fileName(originalFilename)             // 원본이름
                .storedName(storedName)                 // 저장된 이름
                .filePath("/uploads/" + storedName)     // 웹 접근 경로
                .fileSize(file.getSize())               // 파일 용량
                .fileType(fileType)
                .build();

        // 4. FileLog 테이블에 INSERT
        fileLogMapper.insertFileLog(fileLog);

        return fileLog;
    }
}
