package org.appointiko.controller;

import lombok.RequiredArgsConstructor;
import org.appointiko.dto.ActivateRequest;
import org.appointiko.dto.AdminSalonInfo;
import org.appointiko.dto.BoostRequest;
import org.appointiko.model.PlanTier;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonPlan;
import org.appointiko.repo.SalonRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.appointiko.service.PlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SalonRepository salonRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final PlanService planService;

    @GetMapping("/salons")
    public ResponseEntity<List<AdminSalonInfo>> listSalons() {
        List<Salon> salons = salonRepository.findAll();
        List<AdminSalonInfo> result = salons.stream()
                .map(this::toAdminSalonInfo)
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/salons/{id}")
    public ResponseEntity<AdminSalonInfo> getSalon(@PathVariable Long id) {
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
        return ResponseEntity.ok(toAdminSalonInfo(salon));
    }

    @PostMapping("/salons/{id}/activate")
    public ResponseEntity<AdminSalonInfo> activate(@PathVariable Long id, @RequestBody ActivateRequest req) {
        PlanTier tier = PlanTier.valueOf(req.tier());
        planService.activate(id, tier, req.billingCycle(), req.paymentNote());
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
        return ResponseEntity.ok(toAdminSalonInfo(salon));
    }

    @PostMapping("/salons/{id}/deactivate")
    public ResponseEntity<AdminSalonInfo> deactivate(@PathVariable Long id) {
        planService.deactivate(id);
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
        return ResponseEntity.ok(toAdminSalonInfo(salon));
    }

    @PostMapping("/salons/{id}/boost")
    public ResponseEntity<AdminSalonInfo> boost(@PathVariable Long id, @RequestBody BoostRequest req) {
        planService.boost(id, req.days());
        Salon salon = salonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
        return ResponseEntity.ok(toAdminSalonInfo(salon));
    }

    private AdminSalonInfo toAdminSalonInfo(Salon salon) {
        SalonPlan plan = planService.getPlan(salon.getId());
        PlanTier effectiveTier = planService.getEffectiveTier(salon.getId());
        int serviceCount = salonServiceRepository.findBySalonIdOrderByDisplayOrder(salon.getId()).size();

        return new AdminSalonInfo(
                salon.getId(),
                salon.getName(),
                salon.getSlug(),
                salon.getCity(),
                salon.getPhone(),
                salon.isActive(),
                salon.isPromoted(),
                salon.getPromotedUntil(),
                plan != null ? plan.getTier().name() : "FREE",
                effectiveTier.name(),
                plan != null && plan.isTrialUsed(),
                plan != null ? plan.getTrialStartedAt() : null,
                plan != null ? plan.getTrialEndsAt() : null,
                plan != null ? plan.getPaidUntil() : null,
                plan != null ? plan.getBillingCycle() : null,
                plan != null ? plan.getPaymentNote() : null,
                serviceCount,
                salon.getCreatedAt()
        );
    }
}
