package org.appointiko.controller;

import org.appointiko.dto.TenantDTO;
import org.appointiko.model.ServiceSlot;
import org.appointiko.model.Tenant;
import org.appointiko.repo.ServiceSlotRepository;
import org.appointiko.repo.TenantRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Controller
@RequestMapping("/tenant")
public class TenantController {
  private final TenantRepository tenantRepository;
  private final ServiceSlotRepository slotRepository;

  public TenantController(TenantRepository tenantRepository, ServiceSlotRepository slotRepository) {
    this.tenantRepository = tenantRepository;
    this.slotRepository = slotRepository;
  }

  @GetMapping("/signup")
  public String signupForm() {
    return "tenant_signup";
  }

  @PostMapping("/signup")
  public String signup(@ModelAttribute TenantDTO dto, Model model) {
    Tenant t = new Tenant();
    t.setName(dto.getName());
    t.setCity(dto.getCity());
    t.setType(dto.getType());
    t.setAddress(dto.getAddress());
    t.setLatitude(dto.getLatitude());
    t.setLongitude(dto.getLongitude());
    tenantRepository.save(t);
    model.addAttribute("tenant", t);
    return "tenant_dashboard";
  }

  @PostMapping("/slots/add")
  public String addSlot(@RequestParam Long tenantId,
                        @RequestParam String serviceName,
                        @RequestParam String startAt,
                        @RequestParam String endAt,
                        @RequestParam double price,
                        Model model) {
    Tenant t = tenantRepository.findById(tenantId).orElseThrow();
    ServiceSlot s = new ServiceSlot();
    s.setTenant(t);
    s.setServiceName(serviceName);
    s.setStartAt(LocalDateTime.parse(startAt));
    s.setEndAt(LocalDateTime.parse(endAt));
    s.setPrice(price);
    s.setAvailable(true);
    slotRepository.save(s);
    model.addAttribute("tenant", t);
    model.addAttribute("slots", slotRepository.findByTenantIdAndAvailable(t.getId(), true));
    return "tenant_dashboard";
  }
}