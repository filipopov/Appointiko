package org.appointiko.repo;

import org.appointiko.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
  List<Tenant> findByCityIgnoreCase(String city);
  List<Tenant> findByCityIgnoreCaseAndTypeIn(String city, List<String> types);
}
