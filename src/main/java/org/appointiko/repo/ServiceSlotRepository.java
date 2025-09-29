package org.appointiko.repo;

import org.appointiko.model.ServiceSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceSlotRepository extends JpaRepository<ServiceSlot, Long> {
  List<ServiceSlot> findByTenantIdAndAvailable(Long tenantId, boolean available);
  List<ServiceSlot> findByTenantCityAndAvailable(String city, boolean available);
}