-- Required for the overlap constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE berths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    max_length_ft INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    length_ft INTEGER NOT NULL,
    operator VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    berth_id UUID REFERENCES berths(id) ON DELETE CASCADE,
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevents double-booking a berth
    CONSTRAINT no_overlap EXCLUDE USING gist (
        berth_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

-- Indexes for performance
CREATE INDEX idx_berths_max_length ON berths (max_length_ft);
CREATE INDEX idx_vessels_name ON vessels (name);
