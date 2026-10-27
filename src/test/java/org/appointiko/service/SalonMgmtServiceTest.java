package org.appointiko.service;

import org.appointiko.model.Owner;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.model.SalonService;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonPlanRepository;
import org.appointiko.repo.SalonRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class SalonMgmtServiceTest {

    @Autowired private SalonMgmtService salonMgmtService;
    @Autowired private PlanService planService;
    @Autowired private SalonRepository salonRepo;
    @Autowired private SalonPlanRepository planRepo;
    @Autowired private OwnerRepository ownerRepo;
    @Autowired private SalonServiceRepository serviceRepo;

    private Long salonId;

    @BeforeEach
    void setUp() {
        Owner owner = new Owner();
        owner.setEmail("trim-" + System.nanoTime() + "@example.com");
        owner = ownerRepo.save(owner);

        Salon salon = new Salon();
        salon.setOwnerId(owner.getId());
        salon.setName("Trim Test");
        salon.setSlug("trim-test-" + System.nanoTime());
        salon = salonRepo.save(salon);
        salonId = salon.getId();

        // Five active services
        for (int i = 0; i < 5; i++) {
            SalonService s = new SalonService();
            s.setSalonId(salonId);
            s.setName("Svc " + i);
            s.setDurationMinutes(30);
            s.setPrice(500);
            s.setActive(true);
            s.setDisplayOrder(i);
            serviceRepo.save(s);
        }
    }

    @Test
    void keepActiveServices_throwsOnFreeWithMoreThanTwoIds() {
        // No plan = FREE
        List<Long> ids = serviceRepo.findBySalonIdOrderByDisplayOrder(salonId)
                .stream().map(SalonService::getId).toList();

        assertThatThrownBy(() -> salonMgmtService.keepActiveServices(salonId, ids))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PLAN_LIMIT_REACHED");
    }

    @Test
    void keepActiveServices_allowsMoreThanTwo_onStandard() {
        SalonPlan plan = planService.getOrCreatePlan(salonId);
        plan.setTier(PlanTier.STANDARD);
        plan.setPaidUntil(LocalDate.now().plusDays(30));
        planRepo.save(plan);

        List<Long> ids = serviceRepo.findBySalonIdOrderByDisplayOrder(salonId)
                .stream().map(SalonService::getId).toList();

        salonMgmtService.keepActiveServices(salonId, ids);

        long active = serviceRepo.findBySalonIdAndActiveTrueOrderByDisplayOrder(salonId).size();
        assertThat(active).isEqualTo(5);
    }

    @Test
    void keepActiveServices_deactivatesUnselected() {
        List<SalonService> all = serviceRepo.findBySalonIdOrderByDisplayOrder(salonId);
        List<Long> keep = List.of(all.get(0).getId(), all.get(2).getId());

        salonMgmtService.keepActiveServices(salonId, keep);

        List<SalonService> after = serviceRepo.findBySalonIdOrderByDisplayOrder(salonId);
        assertThat(after).hasSize(5); // not deleted
        long active = after.stream().filter(SalonService::isActive).count();
        assertThat(active).isEqualTo(2);

        // Verify the right two are active
        long firstActive = after.stream().filter(s -> s.getId().equals(all.get(0).getId()))
                .filter(SalonService::isActive).count();
        long thirdActive = after.stream().filter(s -> s.getId().equals(all.get(2).getId()))
                .filter(SalonService::isActive).count();
        assertThat(firstActive).isEqualTo(1);
        assertThat(thirdActive).isEqualTo(1);
    }

    @Test
    void keepActiveServices_handlesEmptyList() {
        salonMgmtService.keepActiveServices(salonId, List.of());

        long active = serviceRepo.findBySalonIdAndActiveTrueOrderByDisplayOrder(salonId).size();
        assertThat(active).isEqualTo(0);
    }

    @Test
    void keepActiveServices_handlesNullList() {
        salonMgmtService.keepActiveServices(salonId, null);

        long active = serviceRepo.findBySalonIdAndActiveTrueOrderByDisplayOrder(salonId).size();
        assertThat(active).isEqualTo(0);
    }

    @Test
    void needsServiceTrim_trueWhenFreeWithMoreThanTwoActive() {
        assertThat(salonMgmtService.needsServiceTrim(salonId)).isTrue();
    }

    @Test
    void needsServiceTrim_falseDuringTrial() {
        SalonPlan plan = planService.getOrCreatePlan(salonId);
        plan.setTrialStartedAt(java.time.LocalDateTime.now().minusDays(1));
        plan.setTrialEndsAt(java.time.LocalDateTime.now().plusDays(6));
        planRepo.save(plan);

        assertThat(salonMgmtService.needsServiceTrim(salonId)).isFalse();
    }

    @Test
    void needsServiceTrim_falseOnPaidStandard() {
        SalonPlan plan = planService.getOrCreatePlan(salonId);
        plan.setTier(PlanTier.STANDARD);
        plan.setPaidUntil(LocalDate.now().plusDays(30));
        planRepo.save(plan);

        assertThat(salonMgmtService.needsServiceTrim(salonId)).isFalse();
    }

    @Test
    void needsServiceTrim_falseOnFreeWithTwoOrFewer() {
        // deactivate three to get down to 2 active
        List<SalonService> all = serviceRepo.findBySalonIdOrderByDisplayOrder(salonId);
        for (int i = 2; i < 5; i++) {
            all.get(i).setActive(false);
            serviceRepo.save(all.get(i));
        }

        assertThat(salonMgmtService.needsServiceTrim(salonId)).isFalse();
    }
}
