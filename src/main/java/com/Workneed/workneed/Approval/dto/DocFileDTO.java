package com.Workneed.workneed.Approval.dto;

import lombok.Data;

@Data
public class DocFileDTO {
    private Long fileId;
    private Long docId;
    private String originalName;
    private String savedName;
}

