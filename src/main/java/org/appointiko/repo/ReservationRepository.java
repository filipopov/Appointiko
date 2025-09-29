package org.appointiko.repo;

import org.appointiko.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
  Optional<Reservation> findByConfirmationToken(String token);
}
