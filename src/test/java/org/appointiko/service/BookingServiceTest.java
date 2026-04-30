package org.appointiko.service;

import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonService;
import org.appointiko.model.WorkingHours;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.appointiko.repo.WorkingHoursRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class BookingServiceTest {

    @Autowired private BookingService bookingService;
    @Autowired private SalonRepository salonRepo;
    @Autowired private SalonServiceRepository serviceRepo;
    @Autowired private WorkingHoursRepository whRepo;
    @Autowired private OwnerRepository ownerRepo;

    private Long salonId;
    private SalonService activeService;
    private SalonService inactiveService;

    @BeforeEach
    void setUp() {
        Owner o = new Owner();
        o.setEmail("book-" + System.nanoTime() + "@example.com");
        o.setPasswordHash("$2a$10$x");
        o = ownerRepo.save(o);

        Salon s = new Salon();
        s.setOwnerId(o.getId());
        s.setName("Booking Test");
        s.setSlug("booking-test-" + System.nanoTime());
        salonId = salonRepo.save(s).getId();

        // Working hours: Mon-Sun 9-17 active
        for (int day = 1; day <= 7; day++) {
            WorkingHours wh = new WorkingHours();
            wh.setSalonId(salonId);
            wh.setDayOfWeek(day);
            wh.setBlockOrder(0);
            wh.setStartTime(LocalTime.of(9, 0));
            wh.setEndTime(LocalTime.of(17, 0));
            wh.setWorkingDay(true);
            whRepo.save(wh);
        }

        activeService = new SalonService();
        activeService.setSalonId(salonId);
        activeService.setName("Cut");
        activeService.setDurationMinutes(30);
        activeService.setPrice(500);
        activeService.setActive(true);
        activeService.setDisplayOrder(0);
        activeService = serviceRepo.save(activeService);

        inactiveService = new SalonService();
        inactiveService.setSalonId(salonId);
        inactiveService.setName("Removed");
        inactiveService.setDurationMinutes(30);
        inactiveService.setPrice(700);
        inactiveService.setActive(false);
        inactiveService.setDisplayOrder(1);
        inactiveService = serviceRepo.save(inactiveService);
    }

    private LocalDateTime nextWeekdayAt(LocalTime time) {
        LocalDate d = LocalDate.now().plusDays(1);
        while (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) {
            d = d.plusDays(1);
        }
        return d.atTime(time);
    }

    @Test
    void book_succeeds_forActiveService() {
        LocalDateTime start = nextWeekdayAt(LocalTime.of(10, 0));
        var appt = bookingService.book(salonId, activeService.getId(), start, "Anna", "070123456", null);
        assertThat(appt.getId()).isNotNull();
    }

    @Test
    void book_throwsServiceInactive_forDeactivatedService() {
        LocalDateTime start = nextWeekdayAt(LocalTime.of(10, 0));
        assertThatThrownBy(() ->
                bookingService.book(salonId, inactiveService.getId(), start, "Anna", "070123456", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SERVICE_INACTIVE");
    }

    @Test
    void book_throwsOutsideHours_whenBefore9() {
        LocalDateTime start = nextWeekdayAt(LocalTime.of(8, 30));
        assertThatThrownBy(() ->
                bookingService.book(salonId, activeService.getId(), start, "Anna", "070123456", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OUTSIDE_WORKING_HOURS");
    }

    @Test
    void book_throwsSlotTaken_onDoubleBooking() {
        LocalDateTime start = nextWeekdayAt(LocalTime.of(10, 0));
        bookingService.book(salonId, activeService.getId(), start, "Anna", "070123456", null);

        assertThatThrownBy(() ->
                bookingService.book(salonId, activeService.getId(), start, "Bob", "070999888", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SLOT_TAKEN");
    }

    @Test
    void getAvailableSlots_returnsEmpty_forInactiveService() {
        LocalDate date = nextWeekdayAt(LocalTime.of(0, 0)).toLocalDate();
        List<LocalTime> slots = bookingService.getAvailableSlots(salonId, date, inactiveService.getId());
        assertThat(slots).isEmpty();
    }

    @Test
    void getAvailableSlots_returnsSlots_forActiveService() {
        LocalDate date = nextWeekdayAt(LocalTime.of(0, 0)).toLocalDate();
        List<LocalTime> slots = bookingService.getAvailableSlots(salonId, date, activeService.getId());
        assertThat(slots).isNotEmpty();
        // 9:00 .. 16:30 in 15-min steps where the 30-min slot fits — should be many
        assertThat(slots).contains(LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(16, 30));
    }
}
