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

    // 임시 비밀번호 발송 메서드 추가
    public void sendTempPasswordEmail(String toEmail, String tempPassword) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Workneed");
            helper.setTo(toEmail);
            helper.setSubject("[Workneed] 임시 비밀번호가 발급되었습니다.");

            String body = "<h3>Workneed 임시 비밀번호 안내</h3>" +
                    "<p>안녕하세요, 요청하신 임시 비밀번호를 보내드립니다.</p>" +
                    "<h2 style='color: #16a34a;'>" + tempPassword + "</h2>" +
                    "<p>로그인 후 반드시 비밀번호를 변경해 주세요.</p>" +
                    "<br>" +
                    "<a href='http://localhost:8080/login'>로그인하러 가기</a>";

            helper.setText(body, true);

            mailSender.send(message);
            log.info("임시 비밀번호 메일 발송 성공 → {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("임시 비밀번호 메일 발송 실패: {}", toEmail, e);
        }
    }

    // 회원가입 완료 축하 메일 발송 (추가)
    public void sendWelcomeEmail(String toEmail, String userName) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Workneed");
            helper.setTo(toEmail);
            helper.setSubject("[Workneed] 회원가입을 진심으로 축하드립니다!");

            String body = "<h3>안녕하세요, " + userName + "님!</h3>" +
                    "<p>Workneed의 가족이 되신 것을 환영합니다.</p>" +
                    "<p>현재 계정은 <b>관리자 승인 대기</b> 상태입니다.</p>" +
                    "<p>관리자의 승인이 완료된 후 모든 서비스를 이용하실 수 있습니다.</p>" +
                    "<br>" +
                    "<p>감사합니다.</p>";

            helper.setText(body, true);

            mailSender.send(message);
            log.info("가입 축하 메일 발송 성공 → {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("가입 축하 메일 발송 실패: {}", toEmail, e);
        }
    }


}