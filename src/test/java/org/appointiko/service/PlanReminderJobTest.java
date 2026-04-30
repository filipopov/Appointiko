package org.appointiko.service;

import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanReminderJobTest {

    @Mock private SalonPlanRepository planRepo;
    @Mock private SalonRepository salonRepo;
    @Mock private OwnerRepository ownerRepo;
    @Mock private EmailNotificationService email;
    @InjectMocks private PlanReminderJob job;

    private Owner owner;
    private Salon salon;
    private SalonPlan plan;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(job, "appBaseUrl", "https://test.appointiko.com");

        owner = new Owner();
        owner.setId(1L);
        owner.setEmail("owner@example.com");

        salon = new Salon();
        salon.setId(10L);
        salon.setOwnerId(1L);
        salon.setName("Test Salon");

        plan = new SalonPlan();
        plan.setId(100L);
        plan.setSalonId(10L);
    }

    private void wireOwnerAndSalon() {
        when(salonRepo.findById(10L)).thenReturn(Optional.of(salon));
        when(ownerRepo.findById(1L)).thenReturn(Optional.of(owner));
    }

    // === run() short-circuit ===

    @Test
    void run_skipsBothJobs_whenEmailDisabled() {
        when(email.isEnabled()).thenReturn(false);

        job.run();

        verifyNoInteractions(planRepo, salonRepo, ownerRepo);
    }

    // === Trial nudges ===

    @Test
    void trialNudge_sendsDay1_atOrAfter24h() {
        plan.setTrialStartedAt(LocalDateTime.now().minusHours(25));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(6));
        plan.setTrialNudgeStage(0);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendTrialNudges();

        ArgumentCaptor<String> subject = ArgumentCaptor.forClass(String.class);
        verify(email).sendHtml(eq("owner@example.com"), subject.capture(), anyString());
        assertThat(subject.getValue()).contains("Premium");
        assertThat(plan.getTrialNudgeStage()).isEqualTo(1);
    }

    @Test
    void trialNudge_sendsImmediateWelcome_atTrialStart() {
        // The day-1 message is the welcome — it should fire as soon as the trial starts,
        // not wait 24 hours. (Job runs hourly; first run after signup sends it.)
        plan.setTrialStartedAt(LocalDateTime.now().minusMinutes(5));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(7));
        plan.setTrialNudgeStage(0);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendTrialNudges();

        ArgumentCaptor<String> subject = ArgumentCaptor.forClass(String.class);
        verify(email).sendHtml(eq("owner@example.com"), subject.capture(), anyString());
        assertThat(subject.getValue()).contains("Добредојде"); // welcome
        assertThat(plan.getTrialNudgeStage()).isEqualTo(1);
    }

    @Test
    void trialNudge_doesNotSendStage3_beforeDay3() {
        // Day-1 already sent, day-3 not yet due (only 25h in).
        plan.setTrialStartedAt(LocalDateTime.now().minusHours(25));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(6));
        plan.setTrialNudgeStage(1);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        // owner/salon not wired — but the early-exit on nextStage == 0 should skip
        // before resolveOwner is called, so we expect no interactions at all.

        job.sendTrialNudges();

        verifyNoInteractions(email);
        verify(planRepo, never()).save(any());
        verifyNoInteractions(salonRepo, ownerRepo);
    }

    @Test
    void trialNudge_skipsAlreadySentStage() {
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(2));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(5));
        plan.setTrialNudgeStage(1); // day 1 already sent, day 3 not yet due

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));

        job.sendTrialNudges();

        verifyNoInteractions(email);
    }

    @Test
    void trialNudge_progressesStages_overTime() {
        // Simulate day 3
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(2).minusHours(1));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(4));
        plan.setTrialNudgeStage(1);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendTrialNudges();

        verify(email).sendHtml(anyString(), anyString(), anyString());
        assertThat(plan.getTrialNudgeStage()).isEqualTo(3);
    }

    @Test
    void trialNudge_sendsLastDayMessage_onDay7() {
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(6).minusHours(1));
        plan.setTrialEndsAt(LocalDateTime.now().plusHours(23));
        plan.setTrialNudgeStage(6);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendTrialNudges();

        ArgumentCaptor<String> subject = ArgumentCaptor.forClass(String.class);
        verify(email).sendHtml(eq("owner@example.com"), subject.capture(), anyString());
        assertThat(subject.getValue()).contains("Последен ден");
        assertThat(plan.getTrialNudgeStage()).isEqualTo(7);
    }

    @Test
    void trialNudge_doesNotAdvanceStage_whenEmailFails() {
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(2).minusHours(1));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(5));
        plan.setTrialNudgeStage(1);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(false);

        job.sendTrialNudges();

        verify(planRepo, never()).save(any());
        assertThat(plan.getTrialNudgeStage()).isEqualTo(1);
    }

    @Test
    void trialNudge_skipsSalonWithMissingOwner() {
        plan.setTrialStartedAt(LocalDateTime.now().minusHours(25));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(6));
        plan.setTrialNudgeStage(0);

        when(planRepo.findActiveTrials(any())).thenReturn(List.of(plan));
        when(salonRepo.findById(10L)).thenReturn(Optional.of(salon));
        when(ownerRepo.findById(1L)).thenReturn(Optional.empty());

        job.sendTrialNudges();

        verifyNoInteractions(email);
    }

    // === Payment reminders ===

    @Test
    void paymentReminder_monthly_sends7DayReminder() {
        plan.setTier(org.appointiko.model.PlanTier.STANDARD);
        plan.setBillingCycle("MONTHLY");
        plan.setPaidUntil(LocalDate.now().plusDays(7));
        plan.setPaymentReminderStage(0);

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendPaymentReminders();

        verify(email).sendHtml(eq("owner@example.com"), anyString(), anyString());
        assertThat(plan.getPaymentReminderStage()).isEqualTo(1);
    }

    @Test
    void paymentReminder_monthly_progressesThrough7_3_1() {
        plan.setTier(org.appointiko.model.PlanTier.STANDARD);
        plan.setBillingCycle("MONTHLY");
        plan.setPaymentReminderStage(1);
        plan.setPaidUntil(LocalDate.now().plusDays(3));

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendPaymentReminders();

        assertThat(plan.getPaymentReminderStage()).isEqualTo(2);
    }

    @Test
    void paymentReminder_doesNotResend_sameStage() {
        plan.setTier(org.appointiko.model.PlanTier.STANDARD);
        plan.setBillingCycle("MONTHLY");
        plan.setPaymentReminderStage(1);
        plan.setPaidUntil(LocalDate.now().plusDays(7));

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));

        job.sendPaymentReminders();

        verifyNoInteractions(email);
    }

    @Test
    void paymentReminder_annual_sends30DayFirst() {
        plan.setTier(org.appointiko.model.PlanTier.PREMIUM);
        plan.setBillingCycle("ANNUAL");
        plan.setPaymentReminderStage(0);
        plan.setPaidUntil(LocalDate.now().plusDays(30));

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendPaymentReminders();

        verify(email).sendHtml(eq("owner@example.com"), anyString(), anyString());
        assertThat(plan.getPaymentReminderStage()).isEqualTo(1);
    }

    @Test
    void paymentReminder_annual_skipsTo30DayStage_whenStartingFresh_at14Days() {
        // Annual subscriber, currently 14 days from expiry, no reminders sent yet.
        // Should send the most-recent threshold the user qualifies for and bring stage forward
        // to "all reminders that should have fired by now."
        plan.setTier(org.appointiko.model.PlanTier.PREMIUM);
        plan.setBillingCycle("ANNUAL");
        plan.setPaymentReminderStage(0);
        plan.setPaidUntil(LocalDate.now().plusDays(14));

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));
        wireOwnerAndSalon();
        when(email.sendHtml(anyString(), anyString(), anyString())).thenReturn(true);

        job.sendPaymentReminders();

        // 14 <= 30 AND 14 <= 14 → dueCount = 2, fires the 14-day reminder content,
        // and advances stage to 2 (so the 30-day one is treated as already-counted).
        assertThat(plan.getPaymentReminderStage()).isEqualTo(2);
    }

    @Test
    void paymentReminder_skipsExpired_planAlreadyOverdue() {
        // findActivePaid only returns plans where paidUntil >= today, so this is testing
        // that we handle an unexpected stale row gracefully.
        plan.setTier(org.appointiko.model.PlanTier.STANDARD);
        plan.setBillingCycle("MONTHLY");
        plan.setPaymentReminderStage(3); // already sent all reminders
        plan.setPaidUntil(LocalDate.now().plusDays(1));

        when(planRepo.findActivePaid(any())).thenReturn(List.of(plan));

        job.sendPaymentReminders();

        verifyNoInteractions(email);
    }
}
