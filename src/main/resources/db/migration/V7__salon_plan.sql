-- Salon plan / tier system
CREATE TABLE salon_plan (
    id              BIGSERIAL PRIMARY KEY,
    salon_id        BIGINT NOT NULL UNIQUE REFERENCES salon(id),
    tier            VARCHAR(20) NOT NULL DEFAULT 'FREE',
    trial_used      BOOLEAN NOT NULL DEFAULT FALSE,
    trial_started_at TIMESTAMP,
    trial_ends_at   TIMESTAMP,
    paid_until      DATE,
    billing_cycle   VARCHAR(20),
    payment_note    VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_salon_plan_salon_id ON salon_plan(salon_id);
CREATE INDEX idx_salon_plan_trial_ends_at ON salon_plan(trial_ends_at);

-- Add admin flag to owner
ALTER TABLE owner ADD COLUMN admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create a salon_plan row for every existing salon (all start on FREE)
INSERT INTO salon_plan (salon_id, tier, trial_used, created_at)
SELECT id, 'FREE', FALSE, now()
FROM salon
WHERE id NOT IN (SELECT salon_id FROM salon_plan);
