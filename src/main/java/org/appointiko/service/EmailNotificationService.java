package org.appointiko.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailNotificationService {

    private final Resend resend;
    private final String fromAddress;
    private final boolean enabled;

    public EmailNotificationService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from:Appointiko <onboarding@resend.dev>}") String fromAddress) {
        this.fromAddress = fromAddress;
        this.enabled = apiKey != null && !apiKey.isEmpty();
        this.resend = enabled ? new Resend(apiKey) : null;
        if (!enabled) {
            log.warn("Resend API key not configured — email notifications disabled");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean sendHtml(String toEmail, String subject, String html) {
        if (!enabled) return false;
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject(subject)
                    .html(html)
                    .build();
            resend.emails().send(params);
            log.info("Email '{}' sent to {}", subject, toEmail);
            return true;
        } catch (ResendException e) {
            log.warn("Failed to send email '{}' to {}: {}", subject, toEmail, e.getMessage());
            return false;
        }
    }

    public void sendBookingNotification(String toEmail, String clientName, String serviceName,
                                         String date, String time, String clientPhone) {
        if (!enabled) return;

        try {
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

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("Appointiko: " + clientName + " - " + serviceName)
                    .html(html)
                    .build();

            resend.emails().send(params);
            log.info("Booking email sent to {}", toEmail);
        } catch (ResendException e) {
            log.warn("Failed to send booking email to {}: {}", toEmail, e.getMessage());
        }
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
