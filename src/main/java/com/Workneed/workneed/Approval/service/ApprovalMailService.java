package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.dto.ApprovalLineMailDTO;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ApprovalMailService {

    private final JavaMailSender mailSender;
    private final DocMapper docMapper;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /* =================================================
       1명에게 발송
       ================================================= */
    public void sendApprovalLineTable(Long docId, String toEmail) {

        if (toEmail == null || toEmail.isBlank()) return;

        List<ApprovalLineMailDTO> rows = docMapper.findLinesForMail(docId);

        String subject = "[WorkNeed] 결재선 안내 (문서ID: " + docId + ")";
        String html = buildHtml(docId, rows);

        sendHtml(toEmail, subject, html);
    }

    /* =================================================
       여러 명에게 발송 (병렬 결재 대비)
       ================================================= */
    public void sendApprovalLineTableToApprovers(Long docId, List<Long> approverIds) {

        if (approverIds == null || approverIds.isEmpty()) return;

        List<ApprovalLineMailDTO> rows = docMapper.findLinesForMail(docId);
        String subject = "[WorkNeed] 결재 요청 (문서ID: " + docId + ")";
        String html = buildHtml(docId, rows);

        List<String> emails = docMapper.findEmailsByUserIds(approverIds);

        Set<String> unique = new LinkedHashSet<>();
        if (emails != null) {
            for (String email : emails) {
                if (email != null && !email.isBlank()) {
                    unique.add(email);
                }
            }
        }

        for (String toEmail : unique) {
            sendHtml(toEmail, subject, html);
        }
    }

    /* =================================================
       메일 발송
       ================================================= */
    private void sendHtml(String toEmail, String subject, String html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new IllegalStateException("메일 발송 실패", e);
        }
    }

    /* =================================================
       메일 HTML (카드형 결재 라인)
       ================================================= */
    private String buildHtml(Long docId, List<ApprovalLineMailDTO> rows) {

        StringBuilder sb = new StringBuilder();

        sb.append("<div style='font-family:Arial;'>");
        sb.append("<h2 style='margin-bottom:12px;'>결재 라인</h2>");

        sb.append("<table style='border-collapse:collapse; width:100%; max-width:800px;'>");

        sb.append("<thead><tr>")
                .append(th("차수/역할"))
                .append(th("이름"))
                .append(th("부서"))
                .append(th("직급"))
                .append("</tr></thead>");

        sb.append("<tbody>");
        for (ApprovalLineMailDTO r : rows) {
            // ✅ orderNum만으로 역할을 계산해서 표시 (1=검토, 2=합의, 3+=결재)
            String roleLabel = resolveStepType(r.getOrderNum());

            sb.append("<tr>")
                    .append(td(roleLabel))
                    .append(td(esc(r.getUsername())))
                    .append(td(esc(r.getDeptName())))
                    .append(td(esc(r.getRankName())))
                    .append("</tr>");
        }
        sb.append("</tbody>");

        sb.append("</table>");
        sb.append("<div style='margin-top:12px; color:#888; font-size:12px;'>본 메일은 결재 생성 시 1회 발송됩니다.</div>");
        sb.append("</div>");

        return sb.toString();
    }

    private String th(String text) {
        return "<th style='border:1px solid #ddd; padding:10px; background:#f3f3f3; text-align:left;'>"
                + esc(text) +
                "</th>";
    }

    private String td(String text) {
        return "<td style='border:1px solid #ddd; padding:10px;'>"
                + esc(text) +
                "</td>";
    }

    /**
     * 1차=검토, 2차=합의, 3차 이상=결재
     * (표시용 로직이라 DB/Mapper 파라미터 건드릴 필요 없음)
     */
    private String resolveStepType(int orderNum) {
        return switch (orderNum) {
            case 1 -> "1차 (검토)";
            case 2 -> "2차 (합의)";
            default -> orderNum + "차 (결재)"; // 3차 이상은 전부 결재로 표시
        };
    }

    // HTML escape (기존에 쓰던 esc 그대로 사용)
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

}