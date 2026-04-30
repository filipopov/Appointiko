-- Optional client email captured on manual or public bookings (used for notifications later).
ALTER TABLE appointment ADD COLUMN client_email VARCHAR(200);
