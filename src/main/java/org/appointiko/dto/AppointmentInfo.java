package org.appointiko.dto;

import java.time.LocalDateTime;

public record AppointmentInfo(
        Long id,
        Long serviceId,
        String serviceName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String clientName,
        String clientPhone,
        String status
) {}
