package org.appointiko.dto;

import jakarta.validation.constraints.NotBlank;

public record SalonUpdateRequest(
        @NotBlank String name,
        String city,
        String address,
        String phone,
        String instagram,
        String description,
        Double latitude,
        Double longitude
) {}
