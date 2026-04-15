package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final SalonPlanRepository planRepo;
    private final SalonRepository salonRepo;

    public SalonPlan getPlan(Long salonId) {
        return planRepo.findBySalonId(salonId).orElse(null);
    }

    public PlanTier getEffectiveTier(Long salonId) {
        SalonPlan plan = getPlan(salonId);
        if (plan == null) return PlanTier.FREE;

        // Active trial? They get PREMIUM regardless of actual tier
        if (plan.getTrialEndsAt() != null
                && plan.getTrialEndsAt().isAfter(LocalDateTime.now())) {
            return PlanTier.PREMIUM;
        }

        // Check if paid period is still active
        if (plan.getPaidUntil() != null
                && !plan.getPaidUntil().isBefore(LocalDate.now())) {
            return plan.getTier();
        }

        // Expired or never paid
        return PlanTier.FREE;
    }

    /**
     * Start the 7-day premium trial for a salon.
     * Called on first service creation if trial hasn't been used yet.
     */
    @Transactional
    public void activateTrial(Long salonId) {
        SalonPlan plan = getOrCreatePlan(salonId);
        if (plan.isTrialUsed() || plan.getTrialStartedAt() != null) {
            return; // already used or active
        }

        LocalDateTime now = LocalDateTime.now();
        plan.setTrialStartedAt(now);
        plan.setTrialEndsAt(now.plusDays(7));
        planRepo.save(plan);

        // Set salon as promoted during trial
        Salon salon = salonRepo.findById(salonId).orElse(null);
        if (salon != null) {
            salon.setPromoted(true);
            salon.setPromotedUntil(plan.getTrialEndsAt());
            salonRepo.save(salon);
        }
    }

    @Transactional
    public SalonPlan getOrCreatePlan(Long salonId) {
        return planRepo.findBySalonId(salonId).orElseGet(() -> {
            SalonPlan newPlan = new SalonPlan();
            newPlan.setSalonId(salonId);
            newPlan.setTier(PlanTier.FREE);
            return planRepo.save(newPlan);
        });
    }

    /**
     * Admin activates a salon after confirming payment.
     */
    @Transactional
    public SalonPlan activate(Long salonId, PlanTier tier, String billingCycle, String paymentNote) {
        SalonPlan plan = getOrCreatePlan(salonId);
        plan.setTier(tier);
        plan.setBillingCycle(billingCycle);
        plan.setPaymentNote(paymentNote);

        LocalDate now = LocalDate.now();
        if ("ANNUAL".equals(billingCycle)) {
            plan.setPaidUntil(now.plusYears(1));
        } else {
            plan.setPaidUntil(now.plusMonths(1));
        }

        // If PREMIUM, set promoted
        Salon salon = salonRepo.findById(salonId).orElse(null);
        if (salon != null && tier == PlanTier.PREMIUM) {
            salon.setPromoted(true);
            salon.setPromotedUntil(plan.getPaidUntil().atStartOfDay());
            salonRepo.save(salon);
        }

        return planRepo.save(plan);
    }

    /**
     * Admin deactivates / downgrades a salon to FREE.
     */
    @Transactional
    public SalonPlan deactivate(Long salonId) {
        SalonPlan plan = getOrCreatePlan(salonId);
        plan.setTier(PlanTier.FREE);
        plan.setPaidUntil(null);
        plan.setBillingCycle(null);
        planRepo.save(plan);

        Salon salon = salonRepo.findById(salonId).orElse(null);
        if (salon != null) {
            salon.setPromoted(false);
            salon.setPromotedUntil(null);
            salonRepo.save(salon);
        }

        return plan;
    }

    /**
     * Admin boosts a salon in explore for a given number of days.
     */
    @Transactional
    public void boost(Long salonId, int days) {
        Salon salon = salonRepo.findById(salonId)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
        salon.setPromoted(true);
        salon.setPromotedUntil(LocalDateTime.now().plusDays(days));
        salonRepo.save(salon);
    }

    public boolean canAddService(Long salonId, int currentServiceCount) {
        PlanTier tier = getEffectiveTier(salonId);
        if (tier == PlanTier.FREE) {
            return currentServiceCount < 2;
        }
        return true; // Standard and Premium: unlimited
    }

    public boolean hasNotificationAccess(Long salonId) {
        return getEffectiveTier(salonId).ordinal() >= PlanTier.STANDARD.ordinal();
    }

    public boolean hasExploreAccess(Long salonId) {
        return getEffectiveTier(salonId).ordinal() >= PlanTier.STANDARD.ordinal();
    }
}
