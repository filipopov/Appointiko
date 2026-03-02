package org.appointiko.dto;

public record OwnerInfo(
        Long id,
        String email,
        String phone,
        SalonInfo salon
) {}
