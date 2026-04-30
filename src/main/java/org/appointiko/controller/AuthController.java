package org.appointiko.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SalonMgmtService salonMgmtService;
    private final PlanService planService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest httpReq) {
        try {
            Owner owner = authService.register(req.email(), req.password(), req.phone());
            salonMgmtService.createSalon(owner.getId(), req.salonName(), req.city(), req.address());

            // Auto-login after registration
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
            SecurityContextHolder.getContext().setAuthentication(auth);
            HttpSession session = httpReq.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            return ResponseEntity.ok(buildOwnerInfo(owner));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
            SecurityContextHolder.getContext().setAuthentication(auth);
            HttpSession session = httpReq.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            Owner owner = authService.getByEmail(req.email());
            return ResponseEntity.ok(buildOwnerInfo(owner));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse("INVALID_CREDENTIALS", "Invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ErrorResponse("UNAUTHORIZED", "Not logged in"));
        }
        Owner owner = authService.getByEmail(authentication.getName());
        return ResponseEntity.ok(buildOwnerInfo(owner));
    }

    private OwnerInfo buildOwnerInfo(Owner owner) {
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
        return new OwnerInfo(owner.getId(), owner.getEmail(), owner.getPhone(), salonInfo, owner.isAdmin());
    }
}
