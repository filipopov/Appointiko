package org.appointiko.repo;

import org.appointiko.model.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {
    List<WorkingHours> findBySalonIdOrderByDayOfWeekAscBlockOrderAsc(Long salonId);
    List<WorkingHours> findBySalonIdAndDayOfWeek(Long salonId, int dayOfWeek);
    void deleteBySalonId(Long salonId);
}
