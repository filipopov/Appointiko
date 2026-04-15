package org.appointiko.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminSalonInfo(
        Long id,
        String name,
        String slug,
        String city,
        String phone,
        boolean active,
        boolean promoted,
        LocalDateTime promotedUntil,
        // Plan info
        String tier,
        String effectiveTier,
        boolean trialUsed,
        LocalDateTime trialStartedAt,
        LocalDateTime trialEndsAt,
        LocalDate paidUntil,
        String billingCycle,
        String paymentNote,
        // Stats
        int serviceCount,
        LocalDateTime createdAt
) {}
