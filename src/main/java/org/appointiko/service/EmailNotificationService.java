package org.appointiko.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final boolean enabled;

    public EmailNotificationService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.enabled = !fromAddress.isEmpty();
        if (!enabled) {
            log.warn("Email sender address not configured — email notifications disabled");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void sendBookingNotification(String toEmail, String clientName, String serviceName,
                                         String date, String time, String clientPhone) {
        if (!enabled) return;

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Appointiko: " + clientName + " - " + serviceName);

            String html = """
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                  <h2 style="color:#c0567a;margin:0 0 16px">Nov termin!</h2>
                  <table style="width:100%%;border-collapse:collapse">
                    <tr><td style="padding:8px 0;color:#888">Klient</td><td style="padding:8px 0;font-weight:600">%s</td></tr>
                    <tr><td style="padding:8px 0;color:#888">Usluga</td><td style="padding:8px 0">%s</td></tr>
                    <tr><td style="padding:8px 0;color:#888">Datum</td><td style="padding:8px 0">%s</td></tr>
                    <tr><td style="padding:8px 0;color:#888">Vreme</td><td style="padding:8px 0">%s</td></tr>
                    %s
                  </table>
                  <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:12px;margin:0">Appointiko</p>
                </div>
                """.formatted(
                    escapeHtml(clientName),
                    escapeHtml(serviceName),
                    escapeHtml(date),
                    escapeHtml(time),
                    clientPhone != null && !clientPhone.isEmpty()
                        ? "<tr><td style=\"padding:8px 0;color:#888\">Telefon</td><td style=\"padding:8px 0\">" + escapeHtml(clientPhone) + "</td></tr>"
                        : ""
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Booking email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send booking email to {}: {}", toEmail, e.getMessage());
        }
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
