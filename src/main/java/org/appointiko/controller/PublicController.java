package org.appointiko.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.appointiko.dto.*;
import org.appointiko.model.Appointment;
import org.appointiko.model.Salon;
import org.appointiko.service.BookingService;
import org.appointiko.service.SalonMgmtService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/public/salons/{slug}")
@RequiredArgsConstructor
public class PublicController {

    private final SalonMgmtService salonMgmtService;
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<SalonInfo> getSalon(@PathVariable String slug) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        return ResponseEntity.ok(new SalonInfo(
                salon.getId(), salon.getName(), salon.getSlug(),
                salon.getCity(), salon.getAddress(), salon.getPhone(),
                salon.getInstagram(), salon.isActive()));
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceInfo>> getServices(@PathVariable String slug) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        return ResponseEntity.ok(salonMgmtService.getActiveServices(salon.getId()).stream()
                .map(s -> new ServiceInfo(s.getId(), s.getName(), s.getDurationMinutes(),
                        s.getPrice(), s.isActive(), s.getDisplayOrder()))
                .toList());
    }

    @GetMapping("/slots")
    public ResponseEntity<List<SlotInfo>> getSlots(
            @PathVariable String slug,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        List<LocalTime> slots = bookingService.getAvailableSlots(salon.getId(), date, serviceId);
        return ResponseEntity.ok(slots.stream().map(SlotInfo::new).toList());
    }

    @PostMapping("/book")
    public ResponseEntity<?> book(@PathVariable String slug, @Valid @RequestBody BookingRequest req) {
        try {
            Salon salon = salonMgmtService.getSalonBySlug(slug);
            Appointment appointment = bookingService.book(
                    salon.getId(), req.serviceId(), req.startTime(),
                    req.clientName(), req.clientPhone(), req.comment());
            return ResponseEntity.ok(new AppointmentInfo(
                    appointment.getId(), appointment.getServiceId(), null,
                    appointment.getStartTime(), appointment.getEndTime(),
                    appointment.getClientName(), appointment.getClientPhone(),
                    appointment.getStatus().name(), appointment.getComment()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), e.getMessage()));
        }
    }
}
