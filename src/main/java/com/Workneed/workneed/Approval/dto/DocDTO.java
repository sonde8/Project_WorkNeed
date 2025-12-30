package com.Workneed.workneed.Approval.dto;

import lombok.Data;

@Data
public class DocDTO {
    private Long docId; //submit시 문서 유무 체크 떄문
    private Long writerId;
    private Long typeId;
    private String title;
    private String content;
}
