package org.appointiko.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record WorkingHoursRequest(
        @Valid @Size(min = 7, max = 7) List<WorkingHoursEntry> days
) {}
