-- Add block_order column for multi-block working hours (e.g. morning + afternoon shifts)
ALTER TABLE working_hours ADD COLUMN block_order INT NOT NULL DEFAULT 0;

-- Drop old unique constraint (named in V1)
ALTER TABLE working_hours DROP CONSTRAINT IF EXISTS uq_wh_salon_day;

-- Add new unique constraint including block_order
ALTER TABLE working_hours ADD CONSTRAINT uq_wh_salon_day_block UNIQUE (salon_id, day_of_week, block_order);
