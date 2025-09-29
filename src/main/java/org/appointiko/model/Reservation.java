package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Reservation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  private ServiceSlot slot;

  private String clientName;
  private String clientContact;

  private LocalDateTime createdAt;
  private LocalDateTime confirmedAt;
  private ReservationStatus status;
  private String confirmationToken;
  private LocalDateTime expiresAt;
}