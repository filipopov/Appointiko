package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonService;
import org.appointiko.model.WorkingHours;
import org.appointiko.repo.SalonRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.appointiko.repo.WorkingHoursRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SalonMgmtService {

    private final SalonRepository salonRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final WorkingHoursRepository workingHoursRepository;

    @Transactional
    public Salon createSalon(Long ownerId, String name) {
        Salon salon = new Salon();
        salon.setOwnerId(ownerId);
        salon.setName(name);
        salon.setSlug(generateUniqueSlug(name));
        salon = salonRepository.save(salon);
        initDefaultWorkingHours(salon.getId());
        initDefaultServices(salon.getId());
        return salon;
    }

    public Salon getSalonByOwner(Long ownerId) {
        return salonRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new IllegalStateException("SALON_NOT_FOUND"));
    }

    public Salon getSalonBySlug(String slug) {
        return salonRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("SALON_NOT_FOUND"));
    }

    @Transactional
    public Salon updateSalon(Long salonId, String name, String city, String address, String phone, String instagram) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new IllegalStateException("SALON_NOT_FOUND"));
        salon.setName(name);
        salon.setCity(city);
        salon.setAddress(address);
        salon.setPhone(phone);
        salon.setInstagram(instagram);
        return salonRepository.save(salon);
    }

    // -- Services --

    public List<SalonService> getServices(Long salonId) {
        return salonServiceRepository.findBySalonIdOrderByDisplayOrder(salonId);
    }

    public SalonService getServiceById(Long serviceId) {
        return salonServiceRepository.findById(serviceId).orElse(null);
    }

    public List<SalonService> getActiveServices(Long salonId) {
        return salonServiceRepository.findBySalonIdAndActiveTrueOrderByDisplayOrder(salonId);
    }

    @Transactional
    public SalonService createService(Long salonId, String name, int durationMinutes, int price, int displayOrder) {
        SalonService service = new SalonService();
        service.setSalonId(salonId);
        service.setName(name);
        service.setDurationMinutes(durationMinutes);
        service.setPrice(price);
        service.setDisplayOrder(displayOrder);
        return salonServiceRepository.save(service);
    }

    @Transactional
    public SalonService updateService(Long serviceId, Long salonId, String name, int durationMinutes, int price, boolean active, int displayOrder) {
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));
        if (!service.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("SERVICE_NOT_FOUND");
        }
        service.setName(name);
        service.setDurationMinutes(durationMinutes);
        service.setPrice(price);
        service.setActive(active);
        service.setDisplayOrder(displayOrder);
        return salonServiceRepository.save(service);
    }

    @Transactional
    public void deleteService(Long serviceId, Long salonId) {
        SalonService service = salonServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("SERVICE_NOT_FOUND"));
        if (!service.getSalonId().equals(salonId)) {
            throw new IllegalArgumentException("SERVICE_NOT_FOUND");
        }
        salonServiceRepository.delete(service);
    }

    // -- Working Hours --

    public List<WorkingHours> getWorkingHours(Long salonId) {
        return workingHoursRepository.findBySalonIdOrderByDayOfWeekAscBlockOrderAsc(salonId);
    }

    public boolean hasCustomWorkingHours(Long salonId) {
        List<WorkingHours> hours = getWorkingHours(salonId);
        // Default is Mon-Fri 9-17, Sat-Sun off with single block each
        // If any block differs from this, working hours have been customized
        for (WorkingHours wh : hours) {
            int day = wh.getDayOfWeek();
            boolean expectedWorking = day <= 5;
            if (wh.isWorkingDay() != expectedWorking) return true;
            if (wh.isWorkingDay()) {
                if (!wh.getStartTime().equals(LocalTime.of(9, 0))) return true;
                if (!wh.getEndTime().equals(LocalTime.of(17, 0))) return true;
            }
            if (wh.getBlockOrder() > 0) return true;
        }
        return false;
    }

    @Transactional
    public void setWorkingHours(Long salonId, List<WorkingHours> hours) {
        workingHoursRepository.deleteBySalonId(salonId);
        workingHoursRepository.flush();
        for (WorkingHours wh : hours) {
            wh.setId(null);
            wh.setSalonId(salonId);
            workingHoursRepository.save(wh);
        }
    }

    private void initDefaultWorkingHours(Long salonId) {
        for (int day = 1; day <= 7; day++) {
            WorkingHours wh = new WorkingHours();
            wh.setSalonId(salonId);
            wh.setDayOfWeek(day);
            wh.setBlockOrder(0);
            wh.setStartTime(LocalTime.of(9, 0));
            wh.setEndTime(LocalTime.of(17, 0));
            wh.setWorkingDay(day <= 5); // Mon-Fri working, Sat-Sun off
            workingHoursRepository.save(wh);
        }
    }

    private void initDefaultServices(Long salonId) {
        createService(salonId, "\u041C\u0430\u043D\u0438\u043A\u0438\u0440", 30, 400, 0);    // Маникир
        createService(salonId, "\u0413\u0435\u043B \u043B\u0430\u043A", 60, 700, 1);         // Гел лак
        createService(salonId, "\u041F\u0435\u0434\u0438\u043A\u0438\u0440", 45, 500, 2);    // Педикир
    }

    private String generateUniqueSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (base.isEmpty()) base = "salon";

        String slug = base;
        int counter = 1;
        while (salonRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
