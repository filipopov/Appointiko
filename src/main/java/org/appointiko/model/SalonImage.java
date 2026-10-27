package org.appointiko.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "salon_image")
@Getter
@Setter
@NoArgsConstructor
public class SalonImage {

    @Id
    @Column(name = "salon_id")
    private Long salonId;

    @Column(name = "object_key")
    private String objectKey;

    /** Legacy: bytes of images uploaded before object storage; null for new uploads. */
    @Column(name = "data")
    private byte[] data;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
