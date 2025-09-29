package org.appointiko.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantDTO {
  private String name;
  private String city;
  private String type;
  private String address;
  private double latitude;
  private double longitude;
}