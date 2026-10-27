package org.appointiko.service;

import lombok.RequiredArgsConstructor;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonService;
import org.appointiko.model.WorkingHours;
import org.appointiko.model.SalonImage;
import org.appointiko.model.WorkingHoursOverride;
import org.appointiko.repo.SalonImageRepository;
import org.appointiko.repo.SalonRepository;
import org.appointiko.repo.SalonServiceRepository;
import org.appointiko.repo.WorkingHoursOverrideRepository;
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
    private final WorkingHoursOverrideRepository overrideRepository;
    private final SalonImageRepository imageRepository;
    private final GeocodingService geocodingService;
    private final PlanService planService;
    private final ImageStorage imageStorage;

    public record ImageContent(byte[] data, String contentType) {}

    @Transactional
    public Salon createSalon(Long ownerId, String name, String city, String address) {
        Salon salon = new Salon();
        salon.setOwnerId(ownerId);
        salon.setName(name);
        salon.setCity(city);
        salon.setAddress(address);
        salon.setSlug(generateUniqueSlug(name));
        double[] coords = geocodingService.geocode(address, city);
        if (coords != null) {
            salon.setLatitude(coords[0]);
            salon.setLongitude(coords[1]);
        }
        salon = salonRepository.save(salon);
        planService.getOrCreatePlan(salon.getId());
        initDefaultWorkingHours(salon.getId());
        initDefaultServices(salon.getId());
        return salon;
    }

    public boolean hasSalon(Long ownerId) {
        return salonRepository.findByOwnerId(ownerId).isPresent();
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
    public Salon updateSalon(Long salonId, String name, String city, String address, String phone, String instagram,
                             String description, Double latitude, Double longitude) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new IllegalStateException("SALON_NOT_FOUND"));
        salon.setName(name);
        salon.setPhone(phone);
        salon.setInstagram(instagram);
        salon.setDescription(description);

        // Re-geocode if city or address changed
        boolean addressChanged = !java.util.Objects.equals(salon.getCity(), city)
                || !java.util.Objects.equals(salon.getAddress(), address);
        salon.setCity(city);
        salon.setAddress(address);

        if (addressChanged) {
            double[] coords = geocodingService.geocode(address, city);
            if (coords != null) {
                salon.setLatitude(coords[0]);
                salon.setLongitude(coords[1]);
            }
        } else {
            // Keep manually provided coordinates if address didn't change
            salon.setLatitude(latitude);
            salon.setLongitude(longitude);
        }

        return salonRepository.save(salon);
    }

    public List<Salon> getExploreSalons(String city) {
        List<Salon> salons;
        if (city != null && !city.isBlank()) {
            salons = salonRepository.findActiveByCityOrderByPromotedDescCreatedAtDesc(city);
        } else {
            salons = salonRepository.findByActiveTrueOrderByPromotedDescCreatedAtDesc();
        }
        // Only show salons with Standard+ tier (or active trial) in explore
        return salons.stream()
                .filter(s -> planService.hasExploreAccess(s.getId()))
                .toList();
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
        int currentCount = salonServiceRepository.findBySalonIdOrderByDisplayOrder(salonId).size();
        if (!planService.canAddService(salonId, currentCount)) {
            throw new IllegalStateException("PLAN_LIMIT_REACHED");
        }

        SalonService service = new SalonService();
        service.setSalonId(salonId);
        service.setName(name);
        service.setDurationMinutes(durationMinutes);
        service.setPrice(price);
        service.setDisplayOrder(displayOrder);
        SalonService saved = salonServiceRepository.save(service);

        // Activate trial on first service creation (after default services)
        planService.activateTrial(salonId);

        return saved;
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

    /**
     * Sets only the given service IDs as active=true; deactivates all others.
     * Used by FREE-tier owners after trial expiry to pick which services to keep.
     */
    @Transactional
    public void keepActiveServices(Long salonId, List<Long> keepIds) {
        if (keepIds == null) keepIds = List.of();
        if (keepIds.size() > 2 && planService.getEffectiveTier(salonId) == org.appointiko.model.PlanTier.FREE) {
            throw new IllegalStateException("PLAN_LIMIT_REACHED");
        }
        List<SalonService> all = salonServiceRepository.findBySalonIdOrderByDisplayOrder(salonId);
        for (SalonService svc : all) {
            boolean shouldBeActive = keepIds.contains(svc.getId());
            if (svc.isActive() != shouldBeActive) {
                svc.setActive(shouldBeActive);
                salonServiceRepository.save(svc);
            }
        }
    }

    public boolean needsServiceTrim(Long salonId) {
        if (planService.getEffectiveTier(salonId) != org.appointiko.model.PlanTier.FREE) return false;
        long activeCount = salonServiceRepository.findBySalonIdAndActiveTrueOrderByDisplayOrder(salonId).size();
        return activeCount > 2;
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

    // -- Working Hours overrides (per-date) --

    public List<WorkingHoursOverride> getUpcomingOverrides(Long salonId) {
        return overrideRepository
                .findBySalonIdAndOverrideDateGreaterThanEqualOrderByOverrideDateAscBlockOrderAsc(
                        salonId, java.time.LocalDate.now());
    }

    @Transactional
    public void setOverrideForDate(Long salonId, java.time.LocalDate date,
                                   boolean isWorking, List<java.time.LocalTime[]> blocks) {
        overrideRepository.deleteBySalonIdAndDate(salonId, date);
        overrideRepository.flush();
        if (!isWorking || blocks == null || blocks.isEmpty()) {
            // Store a single non-working marker row.
            WorkingHoursOverride o = new WorkingHoursOverride();
            o.setSalonId(salonId);
            o.setOverrideDate(date);
            o.setBlockOrder(0);
            o.setStartTime(java.time.LocalTime.of(9, 0));
            o.setEndTime(java.time.LocalTime.of(17, 0));
            o.setWorkingDay(false);
            overrideRepository.save(o);
            return;
        }
        for (int i = 0; i < blocks.size(); i++) {
            java.time.LocalTime[] b = blocks.get(i);
            WorkingHoursOverride o = new WorkingHoursOverride();
            o.setSalonId(salonId);
            o.setOverrideDate(date);
            o.setBlockOrder(i);
            o.setStartTime(b[0]);
            o.setEndTime(b[1]);
            o.setWorkingDay(true);
            overrideRepository.save(o);
        }
    }

    @Transactional
    public void deleteOverride(Long salonId, java.time.LocalDate date) {
        overrideRepository.deleteBySalonIdAndDate(salonId, date);
    }

    // -- Salon image / logo --

    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");
    private static final int MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

    @Transactional
    public void setImage(Long salonId, byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("IMAGE_EMPTY");
        }
        if (data.length > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("IMAGE_TOO_LARGE");
        }
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("IMAGE_TYPE_UNSUPPORTED");
        }

        SalonImage img = imageRepository.findById(salonId).orElseGet(SalonImage::new);
        String previousKey = img.getObjectKey();
        String key = "salons/" + salonId + "/" + java.util.UUID.randomUUID();
        imageStorage.put(key, data, contentType.toLowerCase());

        img.setSalonId(salonId);
        img.setObjectKey(key);
        img.setData(null);
        img.setContentType(contentType.toLowerCase());
        img.setUploadedAt(java.time.LocalDateTime.now());
        imageRepository.save(img);
        if (previousKey != null) {
            imageStorage.delete(previousKey);
        }

        Salon salon = salonRepository.findById(salonId).orElseThrow();
        salon.setImageUpdatedAt(img.getUploadedAt());
        salonRepository.save(salon);
    }

    @Transactional
    public void deleteImage(Long salonId) {
        imageRepository.findById(salonId).ifPresent(img -> {
            imageRepository.delete(img);
            if (img.getObjectKey() != null) {
                imageStorage.delete(img.getObjectKey());
            }
        });
        salonRepository.findById(salonId).ifPresent(s -> {
            s.setImageUpdatedAt(null);
            salonRepository.save(s);
        });
    }

    public ImageContent getImage(Long salonId) {
        SalonImage img = imageRepository.findById(salonId).orElse(null);
        if (img == null) {
            return null;
        }
        // Images uploaded before the move to object storage still live in the DB row.
        byte[] data = img.getObjectKey() != null ? imageStorage.get(img.getObjectKey()) : img.getData();
        return new ImageContent(data, img.getContentType());
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
