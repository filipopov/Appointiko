package org.appointiko.dto;

import java.time.LocalDateTime;

public record AppointmentInfo(
        Long id,
        Long serviceId,
        String serviceName,
        int servicePrice,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String clientName,
        String clientPhone,
        String status,
        String comment
) {}
