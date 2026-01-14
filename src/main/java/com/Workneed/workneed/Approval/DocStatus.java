package com.Workneed.workneed.Approval;

public enum DocStatus {
    DRAFT("임시저장"),
    SUBMITTED("송신"),
    IN_PROGRESS("결재중"),
    REJECTED("문서 반려"),
    APPROVED("승인 완료");

    private final String label;
    DocStatus(String label) {
        this.label=label;
    }
    public String getLabel() {
        return label;
    }
}
