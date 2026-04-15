package org.appointiko.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.appointiko.dto.*;
import org.appointiko.model.Appointment;
import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonService;
import org.appointiko.model.WorkingHours;
import org.appointiko.model.PlanTier;
import org.appointiko.model.SalonPlan;
import org.appointiko.service.AuthService;
import org.appointiko.service.BookingService;
import org.appointiko.service.DashboardService;
import org.appointiko.service.PlanService;
import org.appointiko.service.SalonMgmtService;
import org.appointiko.service.WebPushNotificationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerController {

    private final AuthService authService;
    private final SalonMgmtService salonMgmtService;
    private final DashboardService dashboardService;
    private final BookingService bookingService;
    private final WebPushNotificationService webPushService;
    private final PlanService planService;

    // -- Salon --

    @GetMapping("/salon")
    public ResponseEntity<SalonInfo> getSalon(Authentication auth) {
        Salon salon = getOwnerSalon(auth);
        return ResponseEntity.ok(toSalonInfo(salon));
    }

    @PutMapping("/salon")
    public ResponseEntity<SalonInfo> updateSalon(Authentication auth, @Valid @RequestBody SalonUpdateRequest req) {
        Salon salon = getOwnerSalon(auth);
        salon = salonMgmtService.updateSalon(salon.getId(), req.name(), req.city(), req.address(), req.phone(), req.instagram(),
                req.description(), req.latitude(), req.longitude());
        return ResponseEntity.ok(toSalonInfo(salon));
    }

    // -- Services --

    @GetMapping("/services")
    public ResponseEntity<List<ServiceInfo>> getServices(Authentication auth) {
        Salon salon = getOwnerSalon(auth);
        return ResponseEntity.ok(salonMgmtService.getServices(salon.getId()).stream()
                .map(this::toServiceInfo).toList());
    }

    @PostMapping("/services")
    public ResponseEntity<?> createService(Authentication auth, @Valid @RequestBody ServiceRequest req) {
        Salon salon = getOwnerSalon(auth);
        try {
            SalonService svc = salonMgmtService.createService(
                    salon.getId(), req.name(), req.durationMinutes(), req.price(), req.displayOrder());
            return ResponseEntity.ok(toServiceInfo(svc));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), e.getMessage()));
        }
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ServiceInfo> updateService(Authentication auth, @PathVariable Long id,
                                                     @Valid @RequestBody ServiceRequest req) {
        Salon salon = getOwnerSalon(auth);
        SalonService svc = salonMgmtService.updateService(
                id, salon.getId(), req.name(), req.durationMinutes(), req.price(), req.active(), req.displayOrder());
        return ResponseEntity.ok(toServiceInfo(svc));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<Void> deleteService(Authentication auth, @PathVariable Long id) {
        Salon salon = getOwnerSalon(auth);
        salonMgmtService.deleteService(id, salon.getId());
        return ResponseEntity.noContent().build();
    }

    // -- Working Hours --

    @GetMapping("/working-hours")
    public ResponseEntity<List<WorkingHoursEntry>> getWorkingHours(Authentication auth) {
        Salon salon = getOwnerSalon(auth);
        List<WorkingHours> all = salonMgmtService.getWorkingHours(salon.getId());
        return ResponseEntity.ok(groupByDay(all));
    }

    @PutMapping("/working-hours")
    public ResponseEntity<List<WorkingHoursEntry>> setWorkingHours(Authentication auth,
                                                                    @Valid @RequestBody WorkingHoursRequest req) {
        Salon salon = getOwnerSalon(auth);
        List<WorkingHours> entities = new ArrayList<>();
        for (WorkingHoursEntry entry : req.days()) {
            if (entry.isWorkingDay() && entry.blocks() != null) {
                for (int i = 0; i < entry.blocks().size(); i++) {
                    WorkingHoursEntry.TimeBlock block = entry.blocks().get(i);
                    WorkingHours wh = new WorkingHours();
                    wh.setDayOfWeek(entry.dayOfWeek());
                    wh.setBlockOrder(i);
                    wh.setStartTime(block.startTime());
                    wh.setEndTime(block.endTime());
                    wh.setWorkingDay(true);
                    entities.add(wh);
                }
            } else {
                // Non-working day: store single row with default times
                WorkingHours wh = new WorkingHours();
                wh.setDayOfWeek(entry.dayOfWeek());
                wh.setBlockOrder(0);
                wh.setStartTime(java.time.LocalTime.of(9, 0));
                wh.setEndTime(java.time.LocalTime.of(17, 0));
                wh.setWorkingDay(false);
                entities.add(wh);
            }
        }
        salonMgmtService.setWorkingHours(salon.getId(), entities);
        List<WorkingHours> saved = salonMgmtService.getWorkingHours(salon.getId());
        return ResponseEntity.ok(groupByDay(saved));
    }

    // -- Appointments --

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentInfo>> getAppointments(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Salon salon = getOwnerSalon(auth);
        return ResponseEntity.ok(dashboardService.getAppointments(salon.getId(), date));
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(Authentication auth, @Valid @RequestBody OwnerBookingRequest req) {
        Salon salon = getOwnerSalon(auth);
        try {
            Appointment appointment = bookingService.book(
                    salon.getId(), req.serviceId(), req.startTime(),
                    req.clientName(), req.clientPhone() != null ? req.clientPhone() : "",
                    req.comment());
            return ResponseEntity.ok(new AppointmentInfo(
                    appointment.getId(), appointment.getServiceId(), null, 0,
                    appointment.getStartTime(), appointment.getEndTime(),
                    appointment.getClientName(), appointment.getClientPhone(),
                    appointment.getStatus().name(), appointment.getComment()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), e.getMessage()));
        }
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(Authentication auth, @PathVariable Long id) {
        Salon salon = getOwnerSalon(auth);
        dashboardService.cancelAppointment(id, salon.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/appointments/{id}/complete")
    public ResponseEntity<Void> completeAppointment(Authentication auth, @PathVariable Long id) {
        Salon salon = getOwnerSalon(auth);
        dashboardService.completeAppointment(id, salon.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/appointments/{id}/no-show")
    public ResponseEntity<Void> noShowAppointment(Authentication auth, @PathVariable Long id) {
        Salon salon = getOwnerSalon(auth);
        dashboardService.noShowAppointment(id, salon.getId());
        return ResponseEntity.noContent().build();
    }

    // -- Onboarding --

    @GetMapping("/onboarding-status")
    public ResponseEntity<OnboardingStatus> getOnboardingStatus(Authentication auth) {
        Salon salon = getOwnerSalon(auth);
        boolean hasServices = !salonMgmtService.getServices(salon.getId()).isEmpty();
        boolean hasCustomHours = salonMgmtService.hasCustomWorkingHours(salon.getId());
        return ResponseEntity.ok(new OnboardingStatus(hasServices, hasCustomHours));
    }

    // -- Push Notifications --

    @PostMapping("/push/subscribe")
    public ResponseEntity<Void> subscribePush(Authentication auth, @Valid @RequestBody PushSubscriptionRequest req) {
        Salon salon = getOwnerSalon(auth);
        webPushService.subscribe(salon.getId(), req.endpoint(), req.p256dh(), req.auth());
        return ResponseEntity.noContent().build();
    }

    // -- Helpers --

    private Salon getOwnerSalon(Authentication auth) {
        Owner owner = authService.getByEmail(auth.getName());
        return salonMgmtService.getSalonByOwner(owner.getId());
    }

    private SalonInfo toSalonInfo(Salon s) {
        SalonPlan plan = planService.getPlan(s.getId());
        PlanTier effectiveTier = planService.getEffectiveTier(s.getId());
        boolean trialActive = plan != null && plan.getTrialEndsAt() != null
                && plan.getTrialEndsAt().isAfter(java.time.LocalDateTime.now()) && !plan.isTrialUsed();
        return new SalonInfo(s.getId(), s.getName(), s.getSlug(), s.getCity(),
                s.getAddress(), s.getPhone(), s.getInstagram(), s.getDescription(),
                s.getLatitude(), s.getLongitude(), s.isPromoted(), s.isActive(),
                plan != null ? plan.getTier().name() : "FREE",
                effectiveTier.name(),
                trialActive,
                plan != null ? plan.getTrialEndsAt() : null,
                plan != null ? plan.getPaidUntil() : null);
    }

    private ServiceInfo toServiceInfo(SalonService s) {
        return new ServiceInfo(s.getId(), s.getName(), s.getDurationMinutes(),
                s.getPrice(), s.isActive(), s.getDisplayOrder());
    }

    private List<WorkingHoursEntry> groupByDay(List<WorkingHours> all) {
        Map<Integer, List<WorkingHours>> byDay = new LinkedHashMap<>();
        for (int d = 1; d <= 7; d++) byDay.put(d, new ArrayList<>());
        for (WorkingHours wh : all) {
            byDay.computeIfAbsent(wh.getDayOfWeek(), k -> new ArrayList<>()).add(wh);
        }
        List<WorkingHoursEntry> result = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            List<WorkingHours> dayBlocks = byDay.get(day);
            boolean isWorking = !dayBlocks.isEmpty() && dayBlocks.get(0).isWorkingDay();
            List<WorkingHoursEntry.TimeBlock> blocks = dayBlocks.stream()
                    .filter(WorkingHours::isWorkingDay)
                    .map(wh -> new WorkingHoursEntry.TimeBlock(wh.getStartTime(), wh.getEndTime()))
                    .toList();
            result.add(new WorkingHoursEntry(day, isWorking, blocks));
        }
        return result;
    }
}
