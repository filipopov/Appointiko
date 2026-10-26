package org.appointiko.repo;

import org.appointiko.model.Appointment;
import org.appointiko.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a WHERE a.salonId = :salonId " +
           "AND a.startTime >= :dayStart AND a.startTime < :dayEnd " +
           "AND a.status = :status ORDER BY a.startTime")
    List<Appointment> findBySalonIdAndDayAndStatus(
            @Param("salonId") Long salonId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("status") AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.salonId = :salonId " +
           "AND a.startTime >= :dayStart AND a.startTime < :dayEnd " +
           "ORDER BY a.startTime")
    List<Appointment> findBySalonIdAndDay(
            @Param("salonId") Long salonId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.salonId = :salonId " +
           "AND a.status = 'CONFIRMED' " +
           "AND a.startTime < :end AND a.endTime > :start")
    long countOverlapping(
            @Param("salonId") Long salonId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.salonId = :salonId " +
           "AND a.status <> 'CANCELLED' " +
           "AND a.startTime >= :monthStart AND a.startTime < :monthEnd")
    long countBySalonIdThisMonth(
            @Param("salonId") Long salonId,
            @Param("monthStart") LocalDateTime monthStart,
            @Param("monthEnd") LocalDateTime monthEnd);
}
