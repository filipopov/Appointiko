-- Per-date working-hours overrides. When an override exists for a date,
-- it replaces the day-of-week schedule entirely for that date.
CREATE TABLE working_hours_override (
    id              BIGSERIAL PRIMARY KEY,
    salon_id        BIGINT NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
    override_date   DATE NOT NULL,
    block_order     INT NOT NULL DEFAULT 0,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_working_day  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_wh_override_salon_date ON working_hours_override(salon_id, override_date);
