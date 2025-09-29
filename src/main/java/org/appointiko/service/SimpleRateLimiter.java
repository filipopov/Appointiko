package org.appointiko.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SimpleRateLimiter {
  private final Map<String, int[]> map = new ConcurrentHashMap<>();
  private final int WINDOW_SECONDS = 60;
  private final int MAX_PER_WINDOW = 10;

  public boolean allow(String key) {
    int now = (int) Instant.now().getEpochSecond();
    map.putIfAbsent(key, new int[]{0, now});
    int[] data = map.get(key);
    if (now - data[1] >= WINDOW_SECONDS) {
      data[0] = 0;
      data[1] = now;
    }
    if (data[0] < MAX_PER_WINDOW) {
      data[0]++;
      return true;
    }
    return false;
  }
}