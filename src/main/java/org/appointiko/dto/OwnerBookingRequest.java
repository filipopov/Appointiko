package org.appointiko.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record OwnerBookingRequest(
        @NotNull Long serviceId,
        @NotNull LocalDateTime startTime,
        @NotBlank String clientName,
        String clientPhone,
        @Size(max = 500) String comment
) {}
