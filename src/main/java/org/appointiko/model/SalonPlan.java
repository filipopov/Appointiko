package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salon_plan")
@Getter
@Setter
@NoArgsConstructor
public class SalonPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salon_id", nullable = false, unique = true)
    private Long salonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanTier tier = PlanTier.FREE;

    // Trial tracking
    @Column(name = "trial_used", nullable = false)
    private boolean trialUsed = false;

    @Column(name = "trial_started_at")
    private LocalDateTime trialStartedAt;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    // Billing (manual — cash or bank transfer)
    @Column(name = "paid_until")
    private LocalDate paidUntil;

    @Column(name = "billing_cycle")
    private String billingCycle; // MONTHLY, ANNUAL

    @Column(name = "payment_note")
    private String paymentNote; // admin notes ("paid via Halkbank 12/04")

    // Highest trial-nudge day already emailed (0=none, then 1/3/5/6/7).
    @Column(name = "trial_nudge_stage", nullable = false)
    private int trialNudgeStage = 0;

    // Highest payment-reminder threshold already emailed (0=none, then days-before-expiry: 30/14/7/3/1).
    @Column(name = "payment_reminder_stage", nullable = false)
    private int paymentReminderStage = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
