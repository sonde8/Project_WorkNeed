package com.Workneed.workneed.Meetingroom.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/meetingroom")
public class MeetingRoomPageController {

    /**
     * 회의실 현황 + 예약 모달 테스트 페이지
     * (메인페이지 합칠 때 삭제 예정)
     */
    @GetMapping
    public String meetingRoomPage() {
        return "Meetingroom/meetingroom";
    }
}
