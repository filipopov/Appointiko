-- Add fields for salon discovery: location, description, and promotion
ALTER TABLE salon ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE salon ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE salon ADD COLUMN description VARCHAR(500);
ALTER TABLE salon ADD COLUMN promoted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE salon ADD COLUMN promoted_until TIMESTAMP;

-- Index for explore queries: active salons, promoted first
CREATE INDEX idx_salon_active_promoted ON salon (active, promoted DESC, created_at DESC);