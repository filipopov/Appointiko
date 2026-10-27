-- Salon images move to S3-compatible object storage (MinIO). The row keeps the
-- object key; images uploaded before this change keep their bytes in `data`.
ALTER TABLE salon_image ADD COLUMN object_key VARCHAR(255);
ALTER TABLE salon_image ALTER COLUMN data DROP NOT NULL;
