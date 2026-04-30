package org.appointiko.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record WorkingHoursOverrideDto(
        LocalDate date,
        boolean isWorkingDay,
        List<TimeBlock> blocks
) {
    public record TimeBlock(LocalTime startTime, LocalTime endTime) {}
}
