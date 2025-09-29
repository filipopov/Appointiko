package org.appointiko.controller;

import org.appointiko.model.ServiceSlot;
import org.appointiko.model.Tenant;
import org.appointiko.repo.ServiceSlotRepository;
import org.appointiko.repo.TenantRepository;
import org.appointiko.service.ReservationService;
import org.appointiko.service.SimpleRateLimiter;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
public class PublicController {
  private final TenantRepository tenantRepository;
  private final ServiceSlotRepository slotRepository;
  private final ReservationService reservationService;
  private final SimpleRateLimiter rateLimiter;

  public PublicController(TenantRepository tenantRepository, ServiceSlotRepository slotRepository,
                          ReservationService reservationService, SimpleRateLimiter rateLimiter) {
    this.tenantRepository = tenantRepository;
    this.slotRepository = slotRepository;
    this.reservationService = reservationService;
    this.rateLimiter = rateLimiter;
  }

  @GetMapping({"/", "/index"})
  public String index(Model model, @RequestParam(required = false, defaultValue = "Skopje") String city) {
    model.addAttribute("city", city);
    return "index";
  }

  @GetMapping("/api/cities")
  @ResponseBody
  public List<String> suggestCities(@RequestParam String suggest) {
    List<String> allCities = tenantRepository.findAll()
            .stream()
            .map(Tenant::getCity)
            .distinct()
            .toList();

    return allCities.stream()
            .filter(c -> c.toLowerCase().startsWith(suggest.toLowerCase()))
            .toList();
  }

  @GetMapping("/api/tenants/search")
  @ResponseBody
  public List<Tenant> searchTenants(
          @RequestParam(required = false) String name,
          @RequestParam(required = false) String types,
          @RequestParam(required = false) String city
  ) {
    // Simplest version: fetch all, then filter in memory
    List<Tenant> tenants = tenantRepository.findAll();

    if (name != null && !name.isEmpty()) {
      tenants = tenants.stream()
              .filter(t -> t.getName().toLowerCase().contains(name.toLowerCase()))
              .toList();
    }

    if (types != null && !types.isEmpty()) {
      Set<String> typeSet = Arrays.stream(types.split(","))
              .map(String::toLowerCase)
              .collect(Collectors.toSet());
      tenants = tenants.stream()
              .filter(t -> typeSet.contains(t.getType().toLowerCase()))
              .toList();
    }

    if (city != null && !city.isEmpty()) {
      tenants = tenants.stream()
              .filter(t -> t.getCity().equalsIgnoreCase(city))
              .toList();
    }

    return tenants;
  }


  @GetMapping("/api/tenants")
  @ResponseBody
  public List<Tenant> tenants(@RequestParam String city) {
    return tenantRepository.findByCityIgnoreCase(city);
  }

  @GetMapping("/api/slots")
  @ResponseBody
  public List<ServiceSlot> slots(@RequestParam String city) {
    return slotRepository.findByTenantCityAndAvailable(city, true);
  }

  @GetMapping("/reserve/{slotId}")
  public String reserveForm(@PathVariable String slotId, Model model) {
    model.addAttribute("slotId", slotId);
    return "reserve_form";
  }

  @PostMapping("/api/reserve")
  @ResponseBody
  public ResponseEntity<?> reserve(@RequestParam String slotId,
                                   @RequestParam String clientName,
                                   @RequestParam String contact,
                                   HttpServletRequest request) {
    String key = request.getRemoteAddr() + ":" + contact;
    if (!rateLimiter.allow(key)) {
      return ResponseEntity.status(429).body("Too many requests");
    }
    try {
      Long sid = Long.parseLong(slotId);
      return ResponseEntity.ok(reservationService.holdSlot(sid, clientName, contact));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @GetMapping("/confirm")
  public String confirm(@RequestParam String token, Model model) {
    try {
      model.addAttribute("reservation", reservationService.confirm(token));
      return "confirm_result"; // optional template
    } catch (Exception e) {
      model.addAttribute("error", e.getMessage());
      return "confirm_result";
    }
  }
}