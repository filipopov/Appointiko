package org.appointiko.service;

import org.appointiko.model.Owner;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class PlanServiceTest {

    @Autowired private PlanService planService;
    @Autowired private SalonRepository salonRepo;
    @Autowired private SalonPlanRepository planRepo;
    @Autowired private OwnerRepository ownerRepo;

    private Salon salon;

    @BeforeEach
    void setUp() {
        Owner owner = new Owner();
        owner.setEmail("test-" + System.nanoTime() + "@example.com");
        owner.setPasswordHash("$2a$10$x");
        owner = ownerRepo.save(owner);

        salon = new Salon();
        salon.setOwnerId(owner.getId());
        salon.setName("Test Salon");
        salon.setSlug("test-salon-" + System.nanoTime());
        salon = salonRepo.save(salon);
    }

    @Test
    void getEffectiveTier_returnsFree_whenNoPlan() {
        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.FREE);
    }

    @Test
    void getEffectiveTier_returnsPremium_duringActiveTrial() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(2));
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(5));
        plan.setTier(PlanTier.FREE);
        planRepo.save(plan);

        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.PREMIUM);
    }

    @Test
    void getEffectiveTier_returnsPaidTier_whenPaidUntilStillActive() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.STANDARD);
        plan.setPaidUntil(LocalDate.now().plusDays(10));
        planRepo.save(plan);

        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.STANDARD);
    }

    @Test
    void getEffectiveTier_returnsPaidTier_onPaidUntilDayItself() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.PREMIUM);
        plan.setPaidUntil(LocalDate.now()); // expires today — still active per spec
        planRepo.save(plan);

        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.PREMIUM);
    }

    @Test
    void getEffectiveTier_returnsFree_afterPaidUntilExpired() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.PREMIUM);
        plan.setPaidUntil(LocalDate.now().minusDays(1));
        planRepo.save(plan);

        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.FREE);
    }

    @Test
    void getEffectiveTier_returnsFree_afterTrialExpiredAndNoPaid() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTrialStartedAt(LocalDateTime.now().minusDays(10));
        plan.setTrialEndsAt(LocalDateTime.now().minusDays(3));
        planRepo.save(plan);

        assertThat(planService.getEffectiveTier(salon.getId())).isEqualTo(PlanTier.FREE);
    }

    @Test
    void activateTrial_setsTrialDatesAndPromotion() {
        planService.activateTrial(salon.getId());

        SalonPlan plan = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(plan.getTrialStartedAt()).isNotNull();
        assertThat(plan.getTrialEndsAt()).isNotNull();
        assertThat(plan.getTrialEndsAt())
                .isAfter(plan.getTrialStartedAt().plusDays(6).minusMinutes(1))
                .isBefore(plan.getTrialStartedAt().plusDays(7).plusMinutes(1));

        Salon refreshed = salonRepo.findById(salon.getId()).orElseThrow();
        assertThat(refreshed.isPromoted()).isTrue();
        assertThat(refreshed.getPromotedUntil()).isEqualTo(plan.getTrialEndsAt());
    }

    @Test
    void activateTrial_isIdempotent() {
        planService.activateTrial(salon.getId());
        SalonPlan first = planRepo.findBySalonId(salon.getId()).orElseThrow();
        LocalDateTime originalStart = first.getTrialStartedAt();

        planService.activateTrial(salon.getId()); // second call

        SalonPlan after = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(after.getTrialStartedAt()).isEqualTo(originalStart);
    }

    @Test
    void activateTrial_doesNotReactivateAfterTrialUsed() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTrialUsed(true);
        planRepo.save(plan);

        planService.activateTrial(salon.getId());

        SalonPlan after = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(after.getTrialStartedAt()).isNull();
    }

    @Test
    void canAddService_blocksThirdServiceOnFreeTier() {
        // No plan = FREE
        assertThat(planService.canAddService(salon.getId(), 2)).isFalse();
        assertThat(planService.canAddService(salon.getId(), 1)).isTrue();
        assertThat(planService.canAddService(salon.getId(), 0)).isTrue();
    }

    @Test
    void canAddService_allowsUnlimitedOnStandard() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.STANDARD);
        plan.setPaidUntil(LocalDate.now().plusDays(30));
        planRepo.save(plan);

        assertThat(planService.canAddService(salon.getId(), 50)).isTrue();
    }

    @Test
    void canAddService_allowsUnlimitedDuringTrial() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTrialStartedAt(LocalDateTime.now());
        plan.setTrialEndsAt(LocalDateTime.now().plusDays(7));
        planRepo.save(plan);

        assertThat(planService.canAddService(salon.getId(), 10)).isTrue();
    }

    @Test
    void hasNotificationAccess_falseForFree_trueForStandardAndAbove() {
        // FREE
        assertThat(planService.hasNotificationAccess(salon.getId())).isFalse();

        // STANDARD
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.STANDARD);
        plan.setPaidUntil(LocalDate.now().plusDays(10));
        planRepo.save(plan);
        assertThat(planService.hasNotificationAccess(salon.getId())).isTrue();
    }

    @Test
    void deactivate_resetsTierAndPromotion() {
        SalonPlan plan = planService.getOrCreatePlan(salon.getId());
        plan.setTier(PlanTier.PREMIUM);
        plan.setPaidUntil(LocalDate.now().plusDays(30));
        plan.setBillingCycle("MONTHLY");
        planRepo.save(plan);

        Salon s = salonRepo.findById(salon.getId()).orElseThrow();
        s.setPromoted(true);
        s.setPromotedUntil(LocalDateTime.now().plusDays(30));
        salonRepo.save(s);

        planService.deactivate(salon.getId());

        SalonPlan after = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(after.getTier()).isEqualTo(PlanTier.FREE);
        assertThat(after.getPaidUntil()).isNull();
        assertThat(after.getBillingCycle()).isNull();

        Salon afterSalon = salonRepo.findById(salon.getId()).orElseThrow();
        assertThat(afterSalon.isPromoted()).isFalse();
        assertThat(afterSalon.getPromotedUntil()).isNull();
    }

    @Test
    void activate_monthlySetsOneMonthAhead_annualSetsOneYear() {
        planService.activate(salon.getId(), PlanTier.STANDARD, "MONTHLY", "Test");
        SalonPlan monthly = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(monthly.getPaidUntil()).isEqualTo(LocalDate.now().plusMonths(1));

        planService.activate(salon.getId(), PlanTier.PREMIUM, "ANNUAL", "Test annual");
        SalonPlan annual = planRepo.findBySalonId(salon.getId()).orElseThrow();
        assertThat(annual.getPaidUntil()).isEqualTo(LocalDate.now().plusYears(1));
        assertThat(annual.getTier()).isEqualTo(PlanTier.PREMIUM);
    }
}
