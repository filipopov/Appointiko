package org.appointiko.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ServiceRequest(
        @NotBlank String name,
        @Min(1) int durationMinutes,
        @Min(0) int price,
        boolean active,
        int displayOrder
) {}
