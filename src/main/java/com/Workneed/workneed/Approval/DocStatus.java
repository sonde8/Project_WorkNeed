package com.Workneed.workneed.Approval;

public enum DocStatus {
    DRAFT("임시저장"),
    SUBMITTED("송신"),
    IN_PROGRESS("진행중"),
    REJECTED("반려상태"),
    APPROVED("승인상태");

    private final String label;
    DocStatus(String label) {
        this.label=label;
    }
    public String getLabel() {
        return label;
    }
}
