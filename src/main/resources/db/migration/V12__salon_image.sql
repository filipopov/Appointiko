-- Salon profile image / logo. Stored separately from the salon row so the
-- frequently-loaded salon table doesn't pull image bytes on every query.
CREATE TABLE salon_image (
    salon_id        BIGINT PRIMARY KEY REFERENCES salon(id) ON DELETE CASCADE,
    data            BYTEA NOT NULL,
    content_type    VARCHAR(50) NOT NULL,
    uploaded_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- Cache-busting marker on the salon row. Every time the image is uploaded
-- we bump this so client URLs like /api/public/salons/{slug}/image?v={ts}
-- get a fresh download.
ALTER TABLE salon ADD COLUMN image_updated_at TIMESTAMP;
