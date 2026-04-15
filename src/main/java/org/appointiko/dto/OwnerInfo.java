package org.appointiko.dto;

public record OwnerInfo(
        Long id,
        String email,
        String phone,
        SalonInfo salon,
        boolean admin
) {
    // Backwards-compatible constructor
    public OwnerInfo(Long id, String email, String phone, SalonInfo salon) {
        this(id, email, phone, salon, false);
    }
}
