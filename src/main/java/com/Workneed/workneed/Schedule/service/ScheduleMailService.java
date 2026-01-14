package com.Workneed.workneed.Schedule.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleMailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendScheduleInviteEmail(
            String toEmail,
            String inviterName,
            String scheduleTitle,
            String startAt,
            String endAt,
            String scheduleLink
    ) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Workneed");
            helper.setTo(toEmail);
            helper.setSubject("[Workneed] 스케줄 초대가 도착했습니다.");

            String body = """
                <div style="font-family: Arial, sans-serif; line-height:1.6;">
                  <h3>[Workneed] 새로운 스케줄 초대가 도착했습니다</h3>
                  <p><b>초대자:</b> %s</p>
                  <p><b>제목:</b> %s</p>
                  <p><b>기간:</b> %s ~ %s</p>
                  <p style="margin-top:16px;">
                    <a href="%s"
                       style="display:inline-block;padding:10px 14px;border-radius:8px;background:#3A7BD5;color:#fff;text-decoration:none;">
                      스케줄 확인하기
                    </a>
                  </p>
                </div>
            """.formatted(inviterName, scheduleTitle, startAt, endAt, scheduleLink);

            helper.setText(body, true);
            mailSender.send(message);

            log.info("스케줄 초대 메일 발송 성공 → {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("스케줄 초대 메일 발송 실패 → {}", toEmail, e);
        }
    }
}
