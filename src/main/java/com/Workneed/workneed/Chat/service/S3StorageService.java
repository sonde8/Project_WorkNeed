package com.Workneed.workneed.Chat.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Primary
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Override
    public String store(MultipartFile file, String folderName) {
        try {
            if (file.isEmpty()) throw new RuntimeException("빈 파일입니다.");

            // 2. 저장용 고유 이름 생성
            String originalFilename = file.getOriginalFilename().replaceAll("\\s+", "_");
            String storedName = UUID.randomUUID().toString() + "_" + originalFilename;

            // 3. 폴더 경로와 파일명 결합 (S3 내부 경로 생성)
            // 예: profiles/uuid_filename.jpg
            String key = folderName + "/" + storedName;

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            // 4. S3 업로드 (저장 대상을 storedName에서 key로 변경)
            amazonS3.putObject(new PutObjectRequest(bucket, key, file.getInputStream(), metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));

            // 5. 전체 URL 반환 (DB에 폴더명이 포함된 주소가 저장됨)
            return amazonS3.getUrl(bucket, key).toString();
        } catch (IOException e) {
            throw new RuntimeException("S3 업로드 실패", e);
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        try {
            // 1. 전체 URL에서 S3의 Key(경로+파일명)만 추출합니다.
            // 예: https://버킷명.s3.region.amazonaws.com/tasks/uuid_file.txt
            // -> "tasks/uuid_file.txt"만 남깁니다.
            String key = fileUrl.substring(fileUrl.lastIndexOf(".com/") + 5);

            // 2. S3 버킷에서 해당 키를 가진 객체 삭제
            amazonS3.deleteObject(bucket, key);

        } catch (Exception e) {
            // 삭제 실패 시 로그를 남기거나 예외 처리를 합니다.
            System.err.println("S3 파일 삭제 중 오류 발생: " + e.getMessage());
        }
    }
}
