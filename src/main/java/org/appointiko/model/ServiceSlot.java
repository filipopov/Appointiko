package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class ServiceSlot {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  private Tenant tenant;

  private String serviceName;
  private LocalDateTime startAt;
  private LocalDateTime endAt;
  private double price;
  private boolean available = true;
}
