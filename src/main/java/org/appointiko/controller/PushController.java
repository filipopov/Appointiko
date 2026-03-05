package org.appointiko.controller;

import lombok.RequiredArgsConstructor;
import org.appointiko.service.WebPushNotificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushNotificationService webPushService;

    @GetMapping(value = "/vapid-key", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getVapidKey() {
        String key = webPushService.getVapidPublicKey();
        if (key == null || key.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(key);
    }
}
