package org.appointiko.dto;

public record OnboardingStatus(
        boolean hasServices,
        boolean hasCustomHours
) {}
