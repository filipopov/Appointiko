package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.*;
import org.appointiko.repo.AppointmentRepository;
import org.appointiko.repo.SalonServiceRepository;
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
    private final AppointmentRepository appointmentRepository;
    private final EntityManager entityManager;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    public List<LocalTime> getAvailableSlots(Long salonId, LocalDate date, Long serviceId) {
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));

        int dayOfWeek = date.getDayOfWeek().getValue(); // 1=Monday .. 7=Sunday
        List<WorkingHours> blocks = workingHoursRepository.findBySalonIdAndDayOfWeek(salonId, dayOfWeek);
        if (blocks.isEmpty() || !blocks.get(0).isWorkingDay()) {
            return List.of();
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> existing = appointmentRepository.findBySalonIdAndDayAndStatus(
                salonId, dayStart, dayEnd, AppointmentStatus.CONFIRMED);

        int duration = service.getDurationMinutes();
        List<LocalTime> slots = new ArrayList<>();

        for (WorkingHours block : blocks) {
            if (!block.isWorkingDay()) continue;
            LocalTime cursor = block.getStartTime();
            LocalTime blockEnd = block.getEndTime();

            while (!cursor.plusMinutes(duration).isAfter(blockEnd)) {
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
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));
        if (!service.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("SERVICE_NOT_FOUND");
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

        // Validate against working hours — appointment must fit within ANY block
        int dayOfWeek = startTime.getDayOfWeek().getValue();
        List<WorkingHours> blocks = workingHoursRepository.findBySalonIdAndDayOfWeek(salonId, dayOfWeek);
        if (blocks.isEmpty() || !blocks.get(0).isWorkingDay()) {
            throw new IllegalStateException("NOT_WORKING_DAY");
        }

        boolean fitsInBlock = blocks.stream().anyMatch(block ->
                block.isWorkingDay()
                        && !startTime.toLocalTime().isBefore(block.getStartTime())
                        && !endTime.toLocalTime().isAfter(block.getEndTime()));

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
        appointment.setComment(comment);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        return appointmentRepository.save(appointment);
    }
}
