package com.Workneed.workneed.Members.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    // application.properties의 spring.mail.username 사용
    @Value("${spring.mail.username}")
    private String fromEmail;

    // 인증번호 생성 (6자리)
    public String createCode() {
        Random random = new Random();
        return String.valueOf(random.nextInt(888888) + 111111);
    }

    // 회원가입 인증 메일 발송
    public void sendEmail(String toEmail, String code) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Workneed");
            helper.setTo(toEmail);
            helper.setSubject("[Workneed] 회원가입 인증번호입니다.");

            String body = "<h3>Workneed 인증번호</h3>" +
                    "<h1>" + code + "</h1>" +
                    "<p>인증번호를 입력창에 기입해 주세요.</p>";

            helper.setText(body, true);

            mailSender.send(message);
            log.info("메일 발송 시도 완료 → {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("메일 발송 실패: {}", toEmail, e);
        }
    }

    // 회원가입 승인안내 메일 발송 (추가)
    public void sendApprovalEmail(String toEmail, String userName) {
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[Workneed] " + userName + "님의 회원가입이 승인되었습니다.");


            String body = "<h3> 회원가입 승인 안내</h3>" +
                    "<p>안녕하세요, <b>" + userName + "</b>님!</p>" +
                    "<p>Workneed 관리자에 의해 계정 승인이 완료되었습니다.</p>" +
                    "<p>이제 아이디와 비밀번호로 로그인이 가능합니다.</p>" +
                    "<br>" +
                    "<a href='http://localhost:8080/login'>로그인하러 가기</a>";

            helper.setText(body, true);

            mailSender.send(message);
            log.info("{} 님에게 승인 메일 발송 성공", userName);

        } catch (MessagingException e) {
            log.error("{} 님 승인 메일 발송 실패!", userName, e);
        }
    }

}