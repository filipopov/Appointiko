-- Credentials moved to Keycloak. The column is kept (nullable) so legacy hashes
-- remain available for a one-off user import; new owners have no password here.
ALTER TABLE owner ALTER COLUMN password_hash DROP NOT NULL;
