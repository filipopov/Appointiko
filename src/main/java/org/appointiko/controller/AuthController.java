package org.appointiko.controller;

import lombok.RequiredArgsConstructor;
import org.appointiko.dto.*;
import org.appointiko.model.Owner;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.service.AuthService;
import org.appointiko.service.PlanService;
import org.appointiko.service.SalonMgmtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SalonMgmtService salonMgmtService;
    private final PlanService planService;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ErrorResponse("UNAUTHORIZED", "Not logged in"));
        }
        Owner owner = authService.getByEmail(authentication.getName());
        // Admin can come from the Keycloak realm role as well as the owner's flag.
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ResponseEntity.ok(buildOwnerInfo(owner, admin));
    }

    private OwnerInfo buildOwnerInfo(Owner owner, boolean admin) {
        SalonInfo salonInfo = null;
        try {
            Salon salon = salonMgmtService.getSalonByOwner(owner.getId());
            SalonPlan plan = planService.getPlan(salon.getId());
            PlanTier effectiveTier = planService.getEffectiveTier(salon.getId());
            boolean trialActive = plan != null && plan.getTrialEndsAt() != null
                    && plan.getTrialEndsAt().isAfter(java.time.LocalDateTime.now()) && !plan.isTrialUsed();
            salonInfo = new SalonInfo(
                    salon.getId(), salon.getName(), salon.getSlug(),
                    salon.getCity(), salon.getAddress(), salon.getPhone(),
                    salon.getInstagram(), salon.getDescription(),
                    salon.getLatitude(), salon.getLongitude(),
                    salon.isPromoted(), salon.isActive(),
                    plan != null ? plan.getTier().name() : "FREE",
                    effectiveTier.name(),
                    trialActive,
                    plan != null ? plan.getTrialEndsAt() : null,
                    plan != null ? plan.getPaidUntil() : null,
                    salon.getImageUpdatedAt());
        } catch (IllegalStateException e) {
            // Admin or staff owner without a salon — leave salonInfo null.
        }
        return new OwnerInfo(owner.getId(), owner.getEmail(), owner.getPhone(), salonInfo, admin);
    }
}
