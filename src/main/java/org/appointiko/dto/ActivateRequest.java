package org.appointiko.dto;

public record ActivateRequest(
        String tier,          // STANDARD or PREMIUM
        String billingCycle,  // MONTHLY or ANNUAL
        String paymentNote    // e.g. "paid via Halkbank 12/04"
) {}
