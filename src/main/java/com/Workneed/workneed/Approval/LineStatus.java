package com.Workneed.workneed.Approval;

public enum LineStatus {
    PENDING("대기상태"),   // 아직 차례 아님
    WAITING("결재중"),   // 내 차례
    APPROVED("승인완료"),  // 승인
    REJECTED("거절상태");   // 반려


    private final String label;
    LineStatus(String label) {
        this.label=label;
    }
    public String getLabel() {
        return label;
    }
}
