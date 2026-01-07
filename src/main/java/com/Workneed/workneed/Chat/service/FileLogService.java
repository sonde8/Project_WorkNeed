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

        // 1. S3 저장 실행 (이제 전체 URL이 반환됨)
        String fileUrl = storageService.store(file);

        String contentType = file.getContentType();
        String fileType = (contentType != null && contentType.startsWith("image")) ? "IMAGE" : "FILE";

        // 3. DB 저장 데이터 구성
        FileLogDTO fileLog = FileLogDTO.builder()
                .roomId(roomId)
                .fileName(originalFilename)
                .storedName(fileUrl.substring(fileUrl.lastIndexOf("/") + 1)) // URL에서 파일명만 추출
                .filePath(fileUrl) // ★ 중요: "/uploads/"를 붙이지 않고 S3 URL을 그대로 저장
                .fileSize(file.getSize())
                .fileType(fileType)
                .build();

        fileLogMapper.insertFileLog(fileLog);
        return fileLog;
    }

    // 다운로드를 위한 단건 조회 로직 추가
    public FileLogDTO getFileById(Long fileLogId) {
        return fileLogMapper.selectFileLogById(fileLogId);
    }
}
