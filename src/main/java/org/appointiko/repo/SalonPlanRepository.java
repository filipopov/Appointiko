package org.appointiko.repo;

import org.appointiko.model.SalonPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SalonPlanRepository extends JpaRepository<SalonPlan, Long> {

    Optional<SalonPlan> findBySalonId(Long salonId);

    List<SalonPlan> findByTrialEndsAtBeforeAndTrialUsedFalse(LocalDateTime now);
}
