ALTER TABLE brands   ADD COLUMN deleted_at TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at   ON brands(deleted_at);
ALTER TABLE creators ADD COLUMN deleted_at TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_creators_deleted_at ON creators(deleted_at);
