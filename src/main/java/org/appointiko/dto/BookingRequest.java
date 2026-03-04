package org.appointiko.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.appointiko.validation.MacedonianPhone;

import java.time.LocalDateTime;

public record BookingRequest(
        @NotNull Long serviceId,
        @NotNull LocalDateTime startTime,
        @NotBlank String clientName,
        @NotBlank @MacedonianPhone String clientPhone,
        @Size(max = 500) String comment
) {}
