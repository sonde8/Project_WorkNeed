package com.Workneed.workneed.Approval;

public enum LeaveType {
    ANNUAL("연차"),
    HALF_AM("오전반차"),
    HALF_PM("오후반차");


    private final String label;

    LeaveType(String label) {
        this.label=label;
    }

    public String getLabel() {
        return label;
    }
}
