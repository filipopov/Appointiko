package org.appointiko.service;

import org.appointiko.model.Reservation;
import org.appointiko.model.ReservationStatus;
import org.appointiko.model.ServiceSlot;
import org.appointiko.repo.ReservationRepository;
import org.appointiko.repo.ServiceSlotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {
  private final ReservationRepository reservationRepository;
  private final ServiceSlotRepository slotRepository;

  public ReservationService(ReservationRepository reservationRepository, ServiceSlotRepository slotRepository) {
    this.reservationRepository = reservationRepository;
    this.slotRepository = slotRepository;
  }

  @Transactional
  public Reservation holdSlot(Long slotId, String clientName, String contact) {
    ServiceSlot slot = slotRepository.findById(slotId).orElseThrow();
    if (!slot.isAvailable()) throw new IllegalStateException("Slot not available");

    slot.setAvailable(false);
    slotRepository.save(slot);

    Reservation r = new Reservation();
    r.setSlot(slot);
    r.setClientName(clientName);
    r.setClientContact(contact);
    r.setCreatedAt(LocalDateTime.now());
    r.setStatus(ReservationStatus.PENDING);
    r.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    r.setConfirmationToken(UUID.randomUUID().toString());
    return reservationRepository.save(r);
  }

  @Transactional
  public Reservation confirm(String token) {
    Reservation r = reservationRepository.findByConfirmationToken(token).orElseThrow();
    r.setConfirmedAt(LocalDateTime.now());
    r.setStatus(ReservationStatus.CONFIRMED);
    reservationRepository.save(r);
    return r;
  }

//  @Scheduled(fixedDelay = 60_000)
  public void expirePending() {
    List<Reservation> list = reservationRepository.findAll();
    LocalDateTime now = LocalDateTime.now();
    for (Reservation r : list) {
      if (r.getStatus() == ReservationStatus.PENDING && r.getExpiresAt() != null && r.getExpiresAt().isBefore(now)) {
        r.setStatus(ReservationStatus.EXPIRED);
        ServiceSlot s = r.getSlot();
        s.setAvailable(true);
        slotRepository.save(s);
        reservationRepository.save(r);
      }
    }
  }
}