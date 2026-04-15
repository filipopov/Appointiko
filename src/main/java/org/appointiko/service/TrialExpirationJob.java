package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrialExpirationJob {

    private final SalonPlanRepository planRepo;
    private final SalonRepository salonRepo;

    @Scheduled(fixedRate = 3600000) // every hour
    @Transactional
    public void expireTrials() {
        List<SalonPlan> expired = planRepo
                .findByTrialEndsAtBeforeAndTrialUsedFalse(LocalDateTime.now());

        for (SalonPlan plan : expired) {
            plan.setTrialUsed(true);

            // Remove promotion unless they're on a paid Premium plan
            if (plan.getTier() != PlanTier.PREMIUM || plan.getPaidUntil() == null) {
                Salon salon = salonRepo.findById(plan.getSalonId()).orElse(null);
                if (salon != null) {
                    salon.setPromoted(false);
                    salon.setPromotedUntil(null);
                    salonRepo.save(salon);
                }
            }

            planRepo.save(plan);
            log.info("Trial expired for salon {}", plan.getSalonId());
        }

        if (!expired.isEmpty()) {
            log.info("Expired {} trials", expired.size());
        }
    }
}
