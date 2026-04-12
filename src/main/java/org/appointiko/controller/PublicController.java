package org.appointiko.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.appointiko.dto.*;
import org.appointiko.model.Appointment;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonService;
import org.appointiko.model.WorkingHours;
import org.appointiko.repo.AppointmentRepository;
import org.appointiko.service.BookingService;
import org.appointiko.service.NotificationService;
import org.appointiko.service.SalonMgmtService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/salons/{slug}")
@RequiredArgsConstructor
public class PublicController {

    private final SalonMgmtService salonMgmtService;
    private final BookingService bookingService;
    private final NotificationService notificationService;
    private final AppointmentRepository appointmentRepository;

    @GetMapping
    public ResponseEntity<SalonInfo> getSalon(@PathVariable String slug) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        return ResponseEntity.ok(new SalonInfo(
                salon.getId(), salon.getName(), salon.getSlug(),
                salon.getCity(), salon.getAddress(), salon.getPhone(),
                salon.getInstagram(), salon.getDescription(),
                salon.getLatitude(), salon.getLongitude(),
                salon.isPromoted(), salon.isActive()));
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

    @GetMapping("/working-hours")
    public ResponseEntity<List<WorkingHoursEntry>> getWorkingHours(@PathVariable String slug) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        List<WorkingHours> all = salonMgmtService.getWorkingHours(salon.getId());
        return ResponseEntity.ok(groupWorkingHours(all));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable String slug) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        LocalDate now = LocalDate.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = now.plusMonths(1).withDayOfMonth(1).atStartOfDay();
        long count = appointmentRepository.countBySalonIdThisMonth(salon.getId(), monthStart, monthEnd);
        return ResponseEntity.ok(Map.of("bookingsThisMonth", count));
    }

    @GetMapping("/client-lookup")
    public ResponseEntity<Map<String, String>> clientLookup(
            @PathVariable String slug,
            @RequestParam String phone) {
        Salon salon = salonMgmtService.getSalonBySlug(slug);
        List<Appointment> prev = appointmentRepository.findBySalonIdAndClientPhone(salon.getId(), phone);
        if (!prev.isEmpty()) {
            return ResponseEntity.ok(Map.of("clientName", prev.get(0).getClientName()));
        }
        return ResponseEntity.ok(Map.of());
    }

    @PostMapping("/book")
    public ResponseEntity<?> book(@PathVariable String slug, @Valid @RequestBody BookingRequest req) {
        try {
            Salon salon = salonMgmtService.getSalonBySlug(slug);
            Appointment appointment = bookingService.book(
                    salon.getId(), req.serviceId(), req.startTime(),
                    req.clientName(), req.clientPhone(), req.comment());

            // Notify salon owner (push + email, async)
            try {
                SalonService service = salonMgmtService.getServiceById(req.serviceId());
                String serviceName = service != null ? service.getName() : "";
                String date = req.startTime().toLocalDate().toString();
                String time = req.startTime().toLocalTime().toString().substring(0, 5);
                notificationService.notifyNewBooking(
                        salon.getId(), req.clientName(), serviceName, date, time, req.clientPhone());
            } catch (Exception ignored) {
            }

            return ResponseEntity.ok(new AppointmentInfo(
                    appointment.getId(), appointment.getServiceId(), null, 0,
                    appointment.getStartTime(), appointment.getEndTime(),
                    appointment.getClientName(), appointment.getClientPhone(),
                    appointment.getStatus().name(), appointment.getComment()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), e.getMessage()));
        }
    }

    private List<WorkingHoursEntry> groupWorkingHours(List<WorkingHours> all) {
        java.util.Map<Integer, List<WorkingHours>> byDay = new java.util.LinkedHashMap<>();
        for (int d = 1; d <= 7; d++) byDay.put(d, new java.util.ArrayList<>());
        for (WorkingHours wh : all) {
            byDay.computeIfAbsent(wh.getDayOfWeek(), k -> new java.util.ArrayList<>()).add(wh);
        }
        List<WorkingHoursEntry> result = new java.util.ArrayList<>();
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
