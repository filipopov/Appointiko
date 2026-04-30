-- ============================================================================
-- WIPE TEST DATA — keep only admin owners
-- ============================================================================
-- This deletes everything from the application tables EXCEPT:
--   * owners with admin = true
--
-- Use for resetting a staging or local DB before fresh testing.
-- DO NOT RUN ON PRODUCTION unless you really mean it.
--
-- Usage (Postgres):
--   psql $DATABASE_URL -f scripts/wipe_test_data.sql
--
-- Usage (Railway):
--   railway connect <db-service>
--   \i scripts/wipe_test_data.sql
-- ============================================================================

BEGIN;

-- Children first (foreign keys), then parents.
DELETE FROM appointment;
DELETE FROM working_hours;
DELETE FROM salon_service;
DELETE FROM push_subscription;
DELETE FROM salon_plan;
DELETE FROM salon;

-- Drop all non-admin owners.
DELETE FROM owner WHERE admin = false;

-- Reset sequences so new test data starts from 1.
-- (Postgres specific. Comment out for H2.)
SELECT setval(pg_get_serial_sequence('appointment', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('working_hours', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('salon_service', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('push_subscription', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('salon_plan', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('salon', 'id'), 1, false);

-- Show what's left.
SELECT id, email, admin FROM owner ORDER BY id;

COMMIT;
