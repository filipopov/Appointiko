package org.appointiko.dto;

import java.time.LocalTime;
import java.util.List;

public record WorkingHoursEntry(
        int dayOfWeek,
        boolean isWorkingDay,
        List<TimeBlock> blocks
) {
    public record TimeBlock(LocalTime startTime, LocalTime endTime) {}
}
