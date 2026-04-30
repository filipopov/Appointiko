-- Track which trial-nudge / payment-reminder emails have already been sent
-- so the scheduled job doesn't re-send them.
ALTER TABLE salon_plan ADD COLUMN trial_nudge_stage INT NOT NULL DEFAULT 0;
ALTER TABLE salon_plan ADD COLUMN payment_reminder_stage INT NOT NULL DEFAULT 0;
