-- PostgreSQL / Neon. Additive migration; does not modify existing devotional data.
CREATE TABLE IF NOT EXISTS devotion_audio (
 devotion_id text PRIMARY KEY REFERENCES devotions(id) ON DELETE CASCADE,
 mime text NOT NULL,
 bytes integer NOT NULL CHECK (bytes > 0 AND bytes <= 2500000),
 seconds integer NOT NULL CHECK (seconds >= 1 AND seconds <= 180),
 data text NOT NULL,
 created_at bigint NOT NULL
);
