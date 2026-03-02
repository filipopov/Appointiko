package org.appointiko.repo;

import org.appointiko.model.Salon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalonRepository extends JpaRepository<Salon, Long> {
    Optional<Salon> findBySlug(String slug);
    Optional<Salon> findByOwnerId(Long ownerId);
    boolean existsBySlug(String slug);
}
