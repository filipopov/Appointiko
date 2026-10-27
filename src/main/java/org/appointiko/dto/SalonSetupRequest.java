package org.appointiko.dto;

import jakarta.validation.constraints.NotBlank;
import org.appointiko.validation.MacedonianPhone;

public record SalonSetupRequest(
        @NotBlank String salonName,
        @NotBlank String city,
        @NotBlank String address,
        @MacedonianPhone String phone
) {}
