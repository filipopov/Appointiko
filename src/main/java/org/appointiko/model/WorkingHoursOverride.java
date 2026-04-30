package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "working_hours_override")
@Getter
@Setter
@NoArgsConstructor
public class WorkingHoursOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "override_date", nullable = false)
    private LocalDate overrideDate;

    @Column(name = "block_order", nullable = false)
    private int blockOrder = 0;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_working_day", nullable = false)
    private boolean workingDay = true;
}
