package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.dto.AppointmentInfo;
import org.appointiko.model.Appointment;
import org.appointiko.model.AppointmentStatus;
import org.appointiko.model.SalonService;
import org.appointiko.repo.AppointmentRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppointmentRepository appointmentRepository;
    private final SalonServiceRepository salonServiceRepository;

    public List<AppointmentInfo> getAppointments(Long salonId, LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> appointments = appointmentRepository.findBySalonIdAndDay(salonId, dayStart, dayEnd);

        Map<Long, SalonService> servicesMap = salonServiceRepository.findBySalonIdOrderByDisplayOrder(salonId)
                .stream().collect(Collectors.toMap(SalonService::getId, Function.identity()));

        return appointments.stream().map(a -> {
            SalonService svc = servicesMap.get(a.getServiceId());
            return new AppointmentInfo(
                    a.getId(),
                    a.getServiceId(),
                    svc != null ? svc.getName() : "Unknown",
                    svc != null ? svc.getPrice() : 0,
                    a.getStartTime(),
                    a.getEndTime(),
                    a.getClientName(),
                    a.getClientPhone(),
                    a.getStatus().name(),
                    a.getComment()
            );
        }).toList();
    }

    @Transactional
    public void cancelAppointment(Long appointmentId, Long salonId) {
        Appointment appointment = findOwnedAppointment(appointmentId, salonId);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    @Transactional
    public void completeAppointment(Long appointmentId, Long salonId) {
        Appointment appointment = findOwnedAppointment(appointmentId, salonId);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
    }

    @Transactional
    public void noShowAppointment(Long appointmentId, Long salonId) {
        Appointment appointment = findOwnedAppointment(appointmentId, salonId);
        appointment.setStatus(AppointmentStatus.NO_SHOW);
        appointmentRepository.save(appointment);
    }

    private Appointment findOwnedAppointment(Long appointmentId, Long salonId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("APPOINTMENT_NOT_FOUND"));
        if (!appointment.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("APPOINTMENT_NOT_FOUND");
        }
        return appointment;
    }
}
