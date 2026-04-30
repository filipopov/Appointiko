package org.appointiko.repo;

import org.appointiko.model.SalonPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SalonPlanRepository extends JpaRepository<SalonPlan, Long> {

    Optional<SalonPlan> findBySalonId(Long salonId);

    List<SalonPlan> findByTrialEndsAtBeforeAndTrialUsedFalse(LocalDateTime now);

    @Query("SELECT p FROM SalonPlan p WHERE p.trialEndsAt IS NOT NULL " +
            "AND p.trialEndsAt > :now AND p.trialUsed = false")
    List<SalonPlan> findActiveTrials(@Param("now") LocalDateTime now);

    @Query("SELECT p FROM SalonPlan p WHERE p.paidUntil IS NOT NULL AND p.paidUntil >= :today")
    List<SalonPlan> findActivePaid(@Param("today") LocalDate today);
}
