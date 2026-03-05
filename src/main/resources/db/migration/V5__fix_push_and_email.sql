-- Increase endpoint column to accommodate long FCM/push endpoints
ALTER TABLE push_subscription ALTER COLUMN endpoint SET DATA TYPE VARCHAR(2048);
