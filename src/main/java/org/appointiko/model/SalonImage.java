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

    @Column(name = "data", nullable = false)
    private byte[] data;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
