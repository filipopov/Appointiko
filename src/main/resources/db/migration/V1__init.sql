CREATE TABLE owner (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salon (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id        BIGINT NOT NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    city            VARCHAR(100),
    address         VARCHAR(500),
    phone           VARCHAR(30),
    instagram       VARCHAR(100),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owner(id)
);

CREATE TABLE salon_service (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    salon_id          BIGINT NOT NULL,
    name              VARCHAR(255) NOT NULL,
    duration_minutes  INT NOT NULL CHECK (duration_minutes > 0),
    price             INT NOT NULL CHECK (price >= 0),
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    display_order     INT NOT NULL DEFAULT 0,
    FOREIGN KEY (salon_id) REFERENCES salon(id) ON DELETE CASCADE
);

CREATE TABLE working_hours (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    salon_id        BIGINT NOT NULL,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_working_day  BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_wh_salon_day UNIQUE (salon_id, day_of_week),
    CHECK (start_time < end_time),
    FOREIGN KEY (salon_id) REFERENCES salon(id) ON DELETE CASCADE
);

CREATE TABLE appointment (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    salon_id        BIGINT NOT NULL,
    service_id      BIGINT NOT NULL,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    client_name     VARCHAR(255) NOT NULL,
    client_phone    VARCHAR(30) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_time < end_time),
    FOREIGN KEY (salon_id) REFERENCES salon(id),
    FOREIGN KEY (service_id) REFERENCES salon_service(id)
);

CREATE INDEX idx_appt_salon_time ON appointment(salon_id, start_time, end_time);
