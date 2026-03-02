package org.appointiko.repo;

import org.appointiko.model.SalonService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalonServiceRepository extends JpaRepository<SalonService, Long> {
    List<SalonService> findBySalonIdAndActiveTrueOrderByDisplayOrder(Long salonId);
    List<SalonService> findBySalonIdOrderByDisplayOrder(Long salonId);
}
