package org.appointiko.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
        boolean active,
        // Plan info (null for public endpoints)
        String tier,
        String effectiveTier,
        boolean trialActive,
        LocalDateTime trialEndsAt,
        LocalDate paidUntil,
        // Image cache-busting marker (null = no image uploaded)
        LocalDateTime imageUpdatedAt
) {
    // Backward-compat constructor (no image marker)
    public SalonInfo(Long id, String name, String slug, String city, String address,
                     String phone, String instagram, String description,
                     Double latitude, Double longitude, boolean promoted, boolean active,
                     String tier, String effectiveTier, boolean trialActive,
                     LocalDateTime trialEndsAt, LocalDate paidUntil) {
        this(id, name, slug, city, address, phone, instagram, description,
                latitude, longitude, promoted, active, tier, effectiveTier, trialActive,
                trialEndsAt, paidUntil, null);
    }

    // Convenience constructor for public endpoints (no plan info)
    public SalonInfo(Long id, String name, String slug, String city, String address,
                     String phone, String instagram, String description,
                     Double latitude, Double longitude, boolean promoted, boolean active) {
        this(id, name, slug, city, address, phone, instagram, description,
                latitude, longitude, promoted, active, null, null, false, null, null, null);
    }

    public SalonInfo withImageUpdatedAt(LocalDateTime ts) {
        return new SalonInfo(id, name, slug, city, address, phone, instagram, description,
                latitude, longitude, promoted, active, tier, effectiveTier, trialActive,
                trialEndsAt, paidUntil, ts);
    }
}
