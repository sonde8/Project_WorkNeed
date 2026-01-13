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
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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

            // 1. 원본 파일명 처리 (공백을 언더바로 변경)
            String originalFilename = file.getOriginalFilename().replaceAll("\\s+", "_");

            // 2. 저장용 고유 이름 생성 (UUID + 원본파일명)
            // 원본명을 유지하고 싶으신 의도를 반영하여 그대로 사용합니다.
            String storedName = UUID.randomUUID().toString() + "_" + originalFilename;

            // 3. 폴더 경로와 파일명 결합 (S3 내부 경로 생성)
            // 예: task/uuid_원본명.png
            String key = folderName + "/" + storedName;

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            // [추가] 다운로드 시 원본 파일명으로 다운로드되도록 Content-Disposition 설정
            // 한글 파일명을 위해 UTF-8 인코딩을 적용합니다.
            String encodedFileName = java.net.URLEncoder.encode(originalFilename, StandardCharsets.UTF_8.name())
                    .replaceAll("\\+", "%20");
            metadata.setContentDisposition("attachment; filename=\"" + encodedFileName + "\"");

            // 4. S3 업로드
            amazonS3.putObject(new PutObjectRequest(bucket, key, file.getInputStream(), metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));

            // 5. 전체 URL 반환
            // amazonS3.getUrl()은 인코딩된 URL을 반환하므로 DB에는 인코딩된 값이 저장됩니다.
            return amazonS3.getUrl(bucket, key).toString();
        } catch (IOException e) {
            throw new RuntimeException("S3 업로드 실패", e);
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        try {
            // 1. 전체 URL에서 S3의 Key(경로+파일명)만 추출
            // ".com/" 이후의 문자열을 가져옵니다.
            String encodedKey = fileUrl.substring(fileUrl.lastIndexOf(".com/") + 5);

            // [중요] DB에 저장된 URL은 인코딩된 상태(%E1%84...)이므로,
            // S3에서 실제 객체를 찾으려면 다시 디코딩을 해줘야 NoSuchKey 에러를 방지할 수 있습니다.
            String key = URLDecoder.decode(encodedKey, StandardCharsets.UTF_8.name());

            // 2. S3 버킷에서 해당 키를 가진 객체 삭제
            amazonS3.deleteObject(bucket, key);

        } catch (Exception e) {
            // 삭제 실패 시 로그를 남깁니다.
            System.err.println("S3 파일 삭제 중 오류 발생: " + e.getMessage());
        }
    }
}