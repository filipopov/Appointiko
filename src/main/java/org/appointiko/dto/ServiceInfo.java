package org.appointiko.dto;

public record ServiceInfo(
        Long id,
        String name,
        int durationMinutes,
        int price,
        boolean active,
        int displayOrder
) {}
