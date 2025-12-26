package com.Workneed.workneed.Chat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path rootLocation;

    // 생성자: 객체가 생성될 때 폴더 존재 여부를 확인하고 자동으로 만듭니다.
    public LocalStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir);
        try {
            // 폴더가 없으면 생성 (부모 폴더까지 한 번에 생성)
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("저장소 폴더를 생성할 수 없습니다: " + uploadDir, e);
        }
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("빈 파일은 저장할 수 없습니다.");
            }

            // 1. 원본 파일명 추출
            String originalFilename = file.getOriginalFilename();

            // [추가] 파일명에 포함된 공백이나 특수문자가 문제를 일으킬 수 있으므로
            // 깨끗하게 정리해주면 더 좋습니다 (선택사항)
            if (originalFilename != null) {
                originalFilename = originalFilename.replaceAll("\\s+", "_"); // 공백을 언더바로 변경
            }

            // 2. 서버 저장용 고유 이름 생성
            // [수정] UUID 뒤에 언더바(_)와 원본 파일명을 붙입니다.
            String storedName = UUID.randomUUID().toString() + "_" + originalFilename;

            // 3. 파일 저장
            Files.copy(file.getInputStream(),
                    this.rootLocation.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);

            // 4. 생성된 이름을 반환 (이 이름이 DB의 stored_name으로 들어갑니다)
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패", e);
        }
    }
}