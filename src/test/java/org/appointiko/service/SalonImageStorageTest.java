package org.appointiko.service;

import org.appointiko.model.Owner;
import org.appointiko.model.Salon;
import org.appointiko.model.SalonImage;
import org.appointiko.repo.OwnerRepository;
import org.appointiko.repo.SalonImageRepository;
import org.appointiko.repo.SalonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class SalonImageStorageTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G'};

    @Autowired private SalonMgmtService salonMgmtService;
    @Autowired private SalonRepository salonRepo;
    @Autowired private OwnerRepository ownerRepo;
    @Autowired private SalonImageRepository imageRepo;

    @MockitoBean private ImageStorage imageStorage;

    private Long salonId;

    @BeforeEach
    void setUp() {
        Owner owner = new Owner();
        owner.setEmail("img-" + System.nanoTime() + "@example.com");
        owner = ownerRepo.save(owner);

        Salon salon = new Salon();
        salon.setOwnerId(owner.getId());
        salon.setName("Image Test");
        salon.setSlug("image-test-" + System.nanoTime());
        salonId = salonRepo.save(salon).getId();
    }

    @Test
    void upload_storesBytesInObjectStorage_notInDatabase() {
        salonMgmtService.setImage(salonId, PNG, "image/PNG");

        ArgumentCaptor<String> key = ArgumentCaptor.forClass(String.class);
        verify(imageStorage).put(key.capture(), eq(PNG), eq("image/png"));
        assertThat(key.getValue()).startsWith("salons/" + salonId + "/");

        SalonImage row = imageRepo.findById(salonId).orElseThrow();
        assertThat(row.getObjectKey()).isEqualTo(key.getValue());
        assertThat(row.getData()).isNull();
        assertThat(salonRepo.findById(salonId).orElseThrow().getImageUpdatedAt()).isNotNull();
    }

    @Test
    void reupload_deletesPreviousObject() {
        salonMgmtService.setImage(salonId, PNG, "image/png");
        String firstKey = imageRepo.findById(salonId).orElseThrow().getObjectKey();

        salonMgmtService.setImage(salonId, PNG, "image/png");

        verify(imageStorage).delete(firstKey);
        assertThat(imageRepo.findById(salonId).orElseThrow().getObjectKey()).isNotEqualTo(firstKey);
    }

    @Test
    void getImage_readsFromObjectStorage() {
        salonMgmtService.setImage(salonId, PNG, "image/png");
        String key = imageRepo.findById(salonId).orElseThrow().getObjectKey();
        when(imageStorage.get(key)).thenReturn(PNG);

        SalonMgmtService.ImageContent image = salonMgmtService.getImage(salonId);

        assertThat(image.data()).isEqualTo(PNG);
        assertThat(image.contentType()).isEqualTo("image/png");
    }

    @Test
    void getImage_fallsBackToLegacyDatabaseBytes() {
        SalonImage legacy = new SalonImage();
        legacy.setSalonId(salonId);
        legacy.setData(PNG);
        legacy.setContentType("image/png");
        imageRepo.save(legacy);

        assertThat(salonMgmtService.getImage(salonId).data()).isEqualTo(PNG);
        verify(imageStorage, never()).get(anyString());
    }

    @Test
    void delete_removesRowAndObject() {
        salonMgmtService.setImage(salonId, PNG, "image/png");
        String key = imageRepo.findById(salonId).orElseThrow().getObjectKey();

        salonMgmtService.deleteImage(salonId);

        verify(imageStorage).delete(key);
        assertThat(imageRepo.findById(salonId)).isEmpty();
        assertThat(salonMgmtService.getImage(salonId)).isNull();
    }

    @Test
    void invalidType_isRejectedBeforeStorage() {
        assertThatThrownBy(() -> salonMgmtService.setImage(salonId, PNG, "application/pdf"))
                .hasMessage("IMAGE_TYPE_UNSUPPORTED");
        verify(imageStorage, never()).put(anyString(), any(), anyString());
    }
}
