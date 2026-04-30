package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.*;
import org.appointiko.repo.AppointmentRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.appointiko.repo.WorkingHoursOverrideRepository;
import org.appointiko.repo.WorkingHoursRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final SalonServiceRepository salonServiceRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final WorkingHoursOverrideRepository overrideRepository;
    private final AppointmentRepository appointmentRepository;
    private final EntityManager entityManager;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    public List<LocalTime> getAvailableSlots(Long salonId, LocalDate date, Long serviceId) {
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));
        if (!service.isActive()) {
            return List.of();
        }

        // Calendar override takes precedence over the day-of-week schedule.
        var overrides = overrideRepository.findBySalonIdAndOverrideDateOrderByBlockOrderAsc(salonId, date);
        boolean useOverride = !overrides.isEmpty();
        if (useOverride && !overrides.get(0).isWorkingDay()) {
            return List.of();
        }

        int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Monday .. 7=Sunday
        List<WorkingHours> blocks = useOverride
                ? List.of()
                : workingHoursRepository.findBySalonIdAndDayOfWeek(salonId, dayOfWeek);
        if (!useOverride && (blocks.isEmpty() || !blocks.get(0).isWorkingDay())) {
            return List.of();
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> existing = appointmentRepository.findBySalonIdAndDayAndStatus(
                salonId, dayStart, dayEnd, AppointmentStatus.CONFIRMED);

        int duration = service.getDurationMinutes();
        List<LocalTime> slots = new ArrayList<>();

        record Window(LocalTime start, LocalTime end) {}
        List<Window> windows = new ArrayList<>();
        if (useOverride) {
            for (var ov : overrides) {
                if (ov.isWorkingDay()) windows.add(new Window(ov.getStartTime(), ov.getEndTime()));
            }
        } else {
            for (WorkingHours block : blocks) {
                if (block.isWorkingDay()) windows.add(new Window(block.getStartTime(), block.getEndTime()));
            }
        }

        for (Window w : windows) {
            LocalTime cursor = w.start;
            while (!cursor.plusMinutes(duration).isAfter(w.end)) {
                LocalDateTime candidateStart = date.atTime(cursor);
                LocalDateTime candidateEnd = candidateStart.plusMinutes(duration);

                boolean overlaps = existing.stream().anyMatch(a ->
                        candidateStart.isBefore(a.getEndTime()) && candidateEnd.isAfter(a.getStartTime()));

                if (!overlaps) {
                    slots.add(cursor);
                }
                cursor = cursor.plusMinutes(15);
            }
        }
        return slots;
    }

    @Transactional
    public Appointment book(Long salonId, Long serviceId, LocalDateTime startTime,
                            String clientName, String clientPhone, String comment) {
        return book(salonId, serviceId, startTime, clientName, clientPhone, null, comment);
    }

    @Transactional
    public Appointment book(Long salonId, Long serviceId, LocalDateTime startTime,
                            String clientName, String clientPhone, String clientEmail, String comment) {
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));
        if (!service.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("SERVICE_NOT_FOUND");
        }
        if (!service.isActive()) {
            throw new IllegalStateException("SERVICE_INACTIVE");
        }

        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        // Advisory lock for PostgreSQL, skip for H2
        if (driverClassName.contains("postgresql")) {
            entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:salonId)")
                    .setParameter("salonId", salonId)
                    .getSingleResult();
        }

        long overlapping = appointmentRepository.countOverlapping(salonId, startTime, endTime);
        if (overlapping > 0) {
            throw new IllegalStateException("SLOT_TAKEN");
        }

        // Validate against working hours — overrides win over weekly schedule.
        LocalDate date = startTime.toLocalDate();
        var overrides = overrideRepository.findBySalonIdAndOverrideDateOrderByBlockOrderAsc(salonId, date);
        boolean fitsInBlock;
        if (!overrides.isEmpty()) {
            if (!overrides.get(0).isWorkingDay()) {
                throw new IllegalStateException("NOT_WORKING_DAY");
            }
            fitsInBlock = overrides.stream().anyMatch(ov ->
                    ov.isWorkingDay()
                            && !startTime.toLocalTime().isBefore(ov.getStartTime())
                            && !endTime.toLocalTime().isAfter(ov.getEndTime()));
        } else {
            int dayOfWeek = startTime.getDayOfWeek().getValue();
            List<WorkingHours> blocks = workingHoursRepository.findBySalonIdAndDayOfWeek(salonId, dayOfWeek);
            if (blocks.isEmpty() || !blocks.get(0).isWorkingDay()) {
                throw new IllegalStateException("NOT_WORKING_DAY");
            }
            fitsInBlock = blocks.stream().anyMatch(block ->
                    block.isWorkingDay()
                            && !startTime.toLocalTime().isBefore(block.getStartTime())
                            && !endTime.toLocalTime().isAfter(block.getEndTime()));
        }

        if (!fitsInBlock) {
            throw new IllegalStateException("OUTSIDE_WORKING_HOURS");
        }

        Appointment appointment = new Appointment();
        appointment.setSalonId(salonId);
        appointment.setServiceId(serviceId);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setClientName(clientName);
        appointment.setClientPhone(clientPhone);
        appointment.setClientEmail(clientEmail);
        appointment.setComment(comment);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        return appointmentRepository.save(appointment);
    }
}
