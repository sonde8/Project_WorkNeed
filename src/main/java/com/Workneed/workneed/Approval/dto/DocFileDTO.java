package com.Workneed.workneed.Approval.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocFileDTO {
    private Long fileId;        // file_id
    private Long docId;         // doc_id
    private String originalName;// original_name
    private String savedName;   // saved_name
    private Long fileSize;      // file_size
    private String contentType; // content_type
    private LocalDateTime createdAt; // created_at
}

