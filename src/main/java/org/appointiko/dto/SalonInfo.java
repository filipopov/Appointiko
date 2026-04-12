package org.appointiko.dto;

public record SalonInfo(
        Long id,
        String name,
        String slug,
        String city,
        String address,
        String phone,
        String instagram,
        String description,
        Double latitude,
        Double longitude,
        boolean promoted,
        boolean active
) {}
