package org.appointiko.repo;

import org.appointiko.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findBySalonId(Long salonId);

    void deleteByEndpoint(String endpoint);
}
