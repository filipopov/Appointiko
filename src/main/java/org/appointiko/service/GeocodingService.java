package org.appointiko.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Service
public class GeocodingService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Geocode an address using OpenStreetMap Nominatim.
     * Returns [latitude, longitude] or null if not found.
     */
    public double[] geocode(String address, String city) {
        if ((address == null || address.isBlank()) && (city == null || city.isBlank())) {
            return null;
        }

        String query = (address != null ? address : "") + ", " + (city != null ? city : "") + ", North Macedonia";

        try {
            String encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            URI uri = URI.create("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encoded);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .header("User-Agent", "Appointiko/1.0")
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode results = objectMapper.readTree(response.body());
                if (results.isArray() && !results.isEmpty()) {
                    JsonNode first = results.get(0);
                    double lat = first.get("lat").asDouble();
                    double lon = first.get("lon").asDouble();
                    log.info("Geocoded '{}' -> [{}, {}]", query, lat, lon);
                    return new double[]{lat, lon};
                }
            }

            log.warn("Geocoding returned no results for '{}'", query);
        } catch (Exception e) {
            log.warn("Geocoding failed for '{}': {}", query, e.getMessage());
        }

        return null;
    }
}
