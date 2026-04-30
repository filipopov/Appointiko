package org.appointiko.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BoostRequestOwner(@NotNull @Min(1) @Max(365) Integer days) {}
