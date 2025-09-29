package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Tenant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;
  private String city;
  private String type;
  private String address;
  private double latitude;
  private double longitude;
  private boolean active = true;
}