package org.appointiko.repo;

import org.appointiko.model.WorkingHoursOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface WorkingHoursOverrideRepository extends JpaRepository<WorkingHoursOverride, Long> {

    List<WorkingHoursOverride> findBySalonIdAndOverrideDateOrderByBlockOrderAsc(Long salonId, LocalDate date);

    List<WorkingHoursOverride> findBySalonIdAndOverrideDateGreaterThanEqualOrderByOverrideDateAscBlockOrderAsc(
            Long salonId, LocalDate fromDate);

    @Modifying
    @Query("DELETE FROM WorkingHoursOverride o WHERE o.salonId = :salonId AND o.overrideDate = :date")
    void deleteBySalonIdAndDate(@Param("salonId") Long salonId, @Param("date") LocalDate date);
}
