package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final WebPushNotificationService pushService;
    private final EmailNotificationService emailService;
    private final SalonRepository salonRepository;
    private final OwnerRepository ownerRepository;
    private final PlanService planService;

    @Async
    public void notifyNewBooking(Long salonId, String clientName, String serviceName,
                                  String date, String time, String clientPhone) {
        // Only send notifications to Standard+ salons
        if (!planService.hasNotificationAccess(salonId)) {
            log.debug("Skipping notification for salon {} (FREE tier)", salonId);
            return;
        }

        // Push notification
        try {
            String title = "\uD83D\uDCCB " + clientName;
            String body = serviceName + " \u00B7 " + date + " \u00B7 " + time;
            pushService.sendNotification(salonId, title, body);
        } catch (Exception e) {
            log.warn("Push notification failed for salon {}: {}", salonId, e.getMessage());
        }

        // Email notification
        try {
            Salon salon = salonRepository.findById(salonId).orElse(null);
            if (salon != null) {
                Owner owner = ownerRepository.findById(salon.getOwnerId()).orElse(null);
                if (owner != null && owner.getEmail() != null) {
                    emailService.sendBookingNotification(
                            owner.getEmail(), clientName, serviceName, date, time, clientPhone);
                }
            }
        } catch (Exception e) {
            log.warn("Email notification failed for salon {}: {}", salonId, e.getMessage());
        }
    }
}
