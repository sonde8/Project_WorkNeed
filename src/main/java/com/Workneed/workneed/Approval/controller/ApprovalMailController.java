package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.service.ApprovalMailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/approval")
public class ApprovalMailController {

    private final ApprovalMailService approvalMailService;

    /** ✅ 1명에게 발송 */
    @PostMapping("/mail/line/{docId}")
    public String sendLineMailToOne(@PathVariable Long docId,
                                    @RequestParam String toEmail) {

        approvalMailService.sendApprovalLineTable(docId, toEmail);
        return "OK";
    }

    /** ✅ 결재자들(여러 명)에게 발송 */
    @PostMapping("/mail/line/{docId}/approvers")
    public String sendLineMailToApprovers(@PathVariable Long docId,
                                          @RequestParam(name = "approverIds") List<Long> approverIds) {

        approvalMailService.sendApprovalLineTableToApprovers(docId, approverIds);
        return "OK";
    }
}
