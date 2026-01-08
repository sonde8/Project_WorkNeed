package com.Workneed.workneed.Chat.service;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import com.Workneed.workneed.Chat.mapper.FileLogMapper;
import com.Workneed.workneed.Schedule.dto.ScheduleFileDTO;
import com.Workneed.workneed.Schedule.mapper.ScheduleFileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileLogService {

    private final StorageService storageService;
    private final FileLogMapper fileLogMapper;
    private final ScheduleFileMapper scheduleFileMapper;

    /**
     * [채팅방] 파일 저장
     */
    @Transactional
    public FileLogDTO saveFile(MultipartFile file, Long roomId) {
        String originalFilename = file.getOriginalFilename();
        String fileUrl = storageService.store(file, "chat");

        String contentType = file.getContentType();
        String fileType = (contentType != null && contentType.startsWith("image")) ? "IMAGE" : "FILE";

        FileLogDTO fileLog = FileLogDTO.builder()
                .roomId(roomId)
                .fileName(originalFilename)
                .storedName(fileUrl.substring(fileUrl.lastIndexOf("/") + 1))
                .filePath(fileUrl)
                .fileSize(file.getSize())
                .fileType(fileType)
                .build();

        fileLogMapper.insertFileLog(fileLog);
        return fileLog;
    }

    /**
     * [업무/태스크] 파일 저장
     */
    @Transactional
    public ScheduleFileDTO saveScheduleFile(MultipartFile file, Long scheduleId, Long userId) {
        // S3 업로드 로직 재사용
        String fileUrl = storageService.store(file, "task");

        ScheduleFileDTO dto = ScheduleFileDTO.builder()
                .scheduleId(scheduleId)
                .originalName(file.getOriginalFilename())
                .storedName(fileUrl.substring(fileUrl.lastIndexOf("/") + 1))
                .filePath(fileUrl)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(userId)
                .build();

        scheduleFileMapper.insertScheduleFile(dto);
        return dto;
    }

    /**
     * [업무/태스크] 특정 업무의 전체 파일 목록 조회
     */
    public List<ScheduleFileDTO> getFilesByScheduleId(Long scheduleId) {
        return scheduleFileMapper.findFilesByScheduleId(scheduleId);
    }

    /**
     * [채팅방] 다운로드용 단건 조회
     */
    public FileLogDTO getFileById(Long fileLogId) {
        return fileLogMapper.selectFileLogById(fileLogId);
    }

    /**
     * [업무/태스크] 다운로드용 단건 조회 (TaskFileController 필수 메서드)
     */
    public ScheduleFileDTO getScheduleFileById(Long fileId) {
        return scheduleFileMapper.findFileById(fileId);
    }
}