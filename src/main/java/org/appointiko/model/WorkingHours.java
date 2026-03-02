package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "working_hours", uniqueConstraints = @UniqueConstraint(
        name = "uq_wh_salon_day_block",
        columnNames = {"salon_id", "day_of_week", "block_order"}))
@Getter
@Setter
@NoArgsConstructor
public class WorkingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek; // 1=Monday .. 7=Sunday

    @Column(name = "block_order", nullable = false)
    private int blockOrder;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_working_day", nullable = false)
    private boolean isWorkingDay = true;
}
