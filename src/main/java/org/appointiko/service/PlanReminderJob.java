package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Sends trial-nudge and payment-expiry emails to salon owners.
 *
 * Trial nudges: day 1, 3, 5, 6, 7 of the 7-day Premium trial.
 * Monthly payment reminders: 7, 3, 1 days before paidUntil.
 * Annual payment reminders: 30, 14, 7, 3, 1 days before paidUntil.
 *
 * Each reminder is sent at most once per cycle, tracked via SalonPlan.trialNudgeStage
 * and SalonPlan.paymentReminderStage.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PlanReminderJob {

    // Trial nudge day-thresholds, in ascending order.
    private static final int[] TRIAL_DAYS = {1, 3, 5, 6, 7};

    // Payment-expiry reminder thresholds (days before paidUntil), in descending order.
    private static final int[] MONTHLY_REMINDERS = {7, 3, 1};
    private static final int[] ANNUAL_REMINDERS = {30, 14, 7, 3, 1};

    private final SalonPlanRepository planRepo;
    private final SalonRepository salonRepo;
    private final OwnerRepository ownerRepo;
    private final EmailNotificationService email;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @Scheduled(fixedRate = 3600000) // hourly
    @Transactional
    public void run() {
        if (!email.isEnabled()) return;
        sendTrialNudges();
        sendPaymentReminders();
    }

    void sendTrialNudges() {
        List<SalonPlan> trials = planRepo.findActiveTrials(LocalDateTime.now());
        for (SalonPlan plan : trials) {
            if (plan.getTrialStartedAt() == null) continue;

            int daysIntoTrial = (int) Duration.between(plan.getTrialStartedAt(), LocalDateTime.now()).toDays() + 1;
            int nextStage = nextTrialStage(daysIntoTrial, plan.getTrialNudgeStage());
            if (nextStage == 0) continue;

            OwnerSalon target = resolveOwner(plan.getSalonId());
            if (target == null) continue;

            int daysLeft = (int) Math.max(0, ChronoUnit.DAYS.between(LocalDateTime.now(), plan.getTrialEndsAt()));
            String subject = trialSubject(nextStage, daysLeft);
            String html = trialHtml(target.salon.getName(), nextStage, daysLeft);

            if (email.sendHtml(target.owner.getEmail(), subject, html)) {
                plan.setTrialNudgeStage(nextStage);
                planRepo.save(plan);
            }
        }
    }

    void sendPaymentReminders() {
        LocalDate today = LocalDate.now();
        List<SalonPlan> paid = planRepo.findActivePaid(today);
        for (SalonPlan plan : paid) {
            if (plan.getPaidUntil() == null) continue;

            int[] thresholds = "ANNUAL".equals(plan.getBillingCycle()) ? ANNUAL_REMINDERS : MONTHLY_REMINDERS;
            int daysLeft = (int) ChronoUnit.DAYS.between(today, plan.getPaidUntil());

            // Determine how many reminders should have fired by now.
            int dueCount = 0;
            for (int t : thresholds) {
                if (daysLeft <= t) dueCount++;
            }
            if (dueCount <= plan.getPaymentReminderStage()) continue;

            OwnerSalon target = resolveOwner(plan.getSalonId());
            if (target == null) continue;

            int thresholdJustHit = thresholds[dueCount - 1];
            String subject = paymentSubject(thresholdJustHit);
            String html = paymentHtml(target.salon.getName(), thresholdJustHit, plan.getPaidUntil(),
                    "ANNUAL".equals(plan.getBillingCycle()));

            if (email.sendHtml(target.owner.getEmail(), subject, html)) {
                plan.setPaymentReminderStage(dueCount);
                planRepo.save(plan);
            }
        }
    }

    private int nextTrialStage(int daysIntoTrial, int currentStage) {
        for (int day : TRIAL_DAYS) {
            if (day <= daysIntoTrial && day > currentStage) return day;
        }
        return 0;
    }

    private OwnerSalon resolveOwner(Long salonId) {
        Salon salon = salonRepo.findById(salonId).orElse(null);
        if (salon == null) return null;
        Owner owner = ownerRepo.findById(salon.getOwnerId()).orElse(null);
        if (owner == null || owner.getEmail() == null || owner.getEmail().isEmpty()) return null;
        return new OwnerSalon(owner, salon);
    }

    private record OwnerSalon(Owner owner, Salon salon) {}

    // === Email content (Macedonian, primary market) ===

    private String trialSubject(int day, int daysLeft) {
        return switch (day) {
            case 1 -> "Добредојде во Appointiko Premium! 🎉";
            case 3 -> "Како оди со Appointiko?";
            case 5 -> "Уште " + daysLeft + " денови од твојот Premium пробен период";
            case 6 -> "Утре завршува твојот Premium пробен период";
            case 7 -> "Последен ден од Premium пробниот период!";
            default -> "Appointiko Premium";
        };
    }

    private String trialHtml(String salonName, int day, int daysLeft) {
        String body = switch (day) {
            case 1 -> """
                <p>Здраво %s,</p>
                <p>Твојот <b>7-дневен бесплатен Premium</b> пробен период е активиран. Што ти е достапно сега:</p>
                <ul>
                  <li>Неограничен број услуги</li>
                  <li>Email и push известувања за нови термини</li>
                  <li>Промовирање во Explore</li>
                </ul>
                <p>Заврши го поставувањето и сподели го линкот за да почнеш да примаш термини.</p>
                """.formatted(escape(salonName));
            case 3 -> """
                <p>Здраво %s,</p>
                <p>Помина средината од твојот пробен период. Ако ти треба помош или имаш прашање, само одговори на овој email.</p>
                <p>Не заборавај да го споделиш линкот за закажување со клиентите!</p>
                """.formatted(escape(salonName));
            case 5 -> """
                <p>Здраво %s,</p>
                <p>Уште <b>%d денови</b> од Premium пробниот период. Ако сакаш да продолжиш со сите можности, надгради го планот.</p>
                """.formatted(escape(salonName), daysLeft);
            case 6 -> """
                <p>Здраво %s,</p>
                <p>Утре завршува твојот Premium пробен период. По истекот, салонот автоматски ќе се префрли на FREE план (макс. 2 услуги, без известувања).</p>
                <p>За да задржиш Premium, надгради го планот денес.</p>
                """.formatted(escape(salonName));
            case 7 -> """
                <p>Здраво %s,</p>
                <p>Денес е последниот ден од твојот Premium пробен период. Надгради го планот за да продолжиш со сите функции.</p>
                """.formatted(escape(salonName));
            default -> "";
        };
        return wrap("Appointiko Premium", body, "Надгради план");
    }

    private String paymentSubject(int daysBefore) {
        return switch (daysBefore) {
            case 30 -> "Твојата претплата истекува за 30 дена";
            case 14 -> "Твојата претплата истекува за 14 дена";
            case 7 -> "Твојата претплата истекува за 7 дена";
            case 3 -> "Твојата претплата истекува за 3 дена";
            case 1 -> "Твојата претплата истекува утре";
            default -> "Подсетник за плаќање";
        };
    }

    private String paymentHtml(String salonName, int daysBefore, LocalDate expiresOn, boolean annual) {
        String cycleLabel = annual ? "годишна" : "месечна";
        String body = """
            <p>Здраво %s,</p>
            <p>Твојата %s претплата за Appointiko истекува на <b>%s</b> (за %d %s).</p>
            <p>За продолжување, направи уплата на нашата сметка и испрати потврда. По верификација, претплатата автоматски ќе се продолжи.</p>
            <p>Доколку не извршиш уплата до тогаш, салонот ќе се префрли на FREE план (макс. 2 услуги, без известувања).</p>
            """.formatted(escape(salonName), cycleLabel, expiresOn, daysBefore, daysBefore == 1 ? "ден" : "дена");
        return wrap("Подсетник за плаќање", body, "Поглед на планот");
    }

    private String wrap(String heading, String body, String ctaLabel) {
        String settingsUrl = appBaseUrl + "/dashboard/settings#plan";
        return """
            <!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222">
              <h2 style="color:#c0567a;margin:0 0 16px">%s</h2>
              %s
              <p style="margin:24px 0">
                <a href="%s" style="display:inline-block;background:#c0567a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:600">%s</a>
              </p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
              <p style="color:#aaa;font-size:12px;margin:0">Appointiko</p>
            </div>
            </body></html>
            """.formatted(escape(heading), body, settingsUrl, escape(ctaLabel));
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
