package com.Workneed.workneed.Chat.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    // 파일을 물리적으로 저장하고 접근 가능한 URL을 반환하는 명세서
    // 추후에 클라우드로 변경하기 위한 핵심
    String store(MultipartFile file);
}
