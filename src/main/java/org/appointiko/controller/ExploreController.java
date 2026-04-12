package org.appointiko.controller;

import lombok.RequiredArgsConstructor;
import org.appointiko.dto.SalonInfo;
import org.appointiko.model.Salon;
import org.appointiko.service.SalonMgmtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final SalonMgmtService salonMgmtService;

    @GetMapping("/salons")
    public ResponseEntity<List<SalonInfo>> getSalons(@RequestParam(required = false) String city) {
        List<Salon> salons = salonMgmtService.getExploreSalons(city);
        return ResponseEntity.ok(salons.stream().map(this::toSalonInfo).toList());
    }

    private SalonInfo toSalonInfo(Salon s) {
        return new SalonInfo(s.getId(), s.getName(), s.getSlug(), s.getCity(),
                s.getAddress(), s.getPhone(), s.getInstagram(), s.getDescription(),
                s.getLatitude(), s.getLongitude(), s.isPromoted(), s.isActive());
    }
}
