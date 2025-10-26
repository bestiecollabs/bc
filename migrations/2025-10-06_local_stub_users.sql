-- Minimal local-only stub to satisfy /users API in pages dev
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  role TEXT,
  phone TEXT,
  shop_name TEXT,
  is_shopify_store INTEGER,
  tiktok_user_id TEXT,
  instagram_user_id TEXT
);

-- Optional sample data for testing
INSERT OR IGNORE INTO users (id, email, username, full_name, role, phone, shop_name, is_shopify_store, tiktok_user_id, instagram_user_id) VALUES
('u_test_1','owner@example.com','owner','Owner Admin','admin',NULL,NULL,0,NULL,NULL),
('u_test_2','test@example.com','testuser','Test User','user','555-5555','Test Shop',1,'tt123','ig456');
