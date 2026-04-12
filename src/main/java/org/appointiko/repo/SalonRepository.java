package org.appointiko.repo;

import org.appointiko.model.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SalonRepository extends JpaRepository<Salon, Long> {
    Optional<Salon> findBySlug(String slug);
    Optional<Salon> findByOwnerId(Long ownerId);
    boolean existsBySlug(String slug);

    List<Salon> findByActiveTrueOrderByPromotedDescCreatedAtDesc();

    @Query("SELECT s FROM Salon s WHERE s.active = true AND s.city = :city ORDER BY s.promoted DESC, s.createdAt DESC")
    List<Salon> findActiveByCityOrderByPromotedDescCreatedAtDesc(@Param("city") String city);
}
