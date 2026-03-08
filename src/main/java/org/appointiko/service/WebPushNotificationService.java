package org.appointiko.service;

import com.interaso.webpush.VapidKeys;
import com.interaso.webpush.WebPush;
import com.interaso.webpush.WebPushService;
import lombok.extern.slf4j.Slf4j;
import org.appointiko.model.PushSubscription;
import org.appointiko.repo.PushSubscriptionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class WebPushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final WebPushService pushService;
    private final String vapidPublicKey;

    public WebPushNotificationService(
            PushSubscriptionRepository pushSubscriptionRepository,
            @Value("${vapid.public-key:}") String publicKey,
            @Value("${vapid.private-key:}") String privateKey) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.vapidPublicKey = publicKey;

        if (!publicKey.isEmpty() && !privateKey.isEmpty()) {
            VapidKeys vapidKeys = VapidKeys.fromUncompressedBytes(publicKey, privateKey);
            this.pushService = new WebPushService("mailto:noreply@appointiko.mk", vapidKeys);
        } else {
            this.pushService = null;
            log.warn("VAPID keys not configured — push notifications disabled");
        }
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    public boolean isEnabled() {
        return pushService != null;
    }

    @Transactional
    public void subscribe(Long salonId, String endpoint, String p256dh, String auth) {
        // Upsert: delete old if endpoint already exists, then insert
        pushSubscriptionRepository.deleteByEndpoint(endpoint);
        pushSubscriptionRepository.flush();

        PushSubscription sub = new PushSubscription();
        sub.setSalonId(salonId);
        sub.setEndpoint(endpoint);
        sub.setP256dh(p256dh);
        sub.setAuth(auth);
        pushSubscriptionRepository.save(sub);
    }

    @Transactional
    public void sendNotification(Long salonId, String title, String body) {
        if (pushService == null) return;

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findBySalonId(salonId);
        log.info("Sending push for salon {}: found {} subscriptions", salonId, subscriptions.size());
        String payload = "{\"title\":" + jsonEscape(title) + ",\"body\":" + jsonEscape(body) + ",\"url\":\"/dashboard\"}";

        for (PushSubscription sub : subscriptions) {
            try {
                WebPush.SubscriptionState state = pushService.send(
                        payload,
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth(),
                        null,  // ttl
                        null,  // topic
                        null   // urgency
                );
                log.info("Push result for {}: {}", sub.getEndpoint().substring(0, Math.min(60, sub.getEndpoint().length())), state);
                if (state == WebPush.SubscriptionState.EXPIRED) {
                    log.info("Push subscription expired, removing: {}", sub.getEndpoint());
                    pushSubscriptionRepository.delete(sub);
                }
            } catch (Exception e) {
                log.warn("Failed to send push notification to {}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }

    private static String jsonEscape(String value) {
        return "\"" + value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                + "\"";
    }
}
