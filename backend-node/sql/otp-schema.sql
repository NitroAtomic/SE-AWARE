-- ============================================================
-- One-time login codes for Premium accounts.
--
-- Run this once against an existing database:
--   USE se_aware;
--   SOURCE backend-node/sql/otp-schema.sql;
--
-- schema.sql also creates it, so a fresh install needs nothing extra.
--
-- Notes on the shape:
--   code_hash  the code is bcrypt-hashed, never stored in the clear. Anyone
--              reading the table still cannot sign in as someone else.
--   expires_at codes are short-lived; an old one is useless.
--   used       a code works once. Verifying marks it used.
--   attempts   capped, so the six digits cannot be guessed by brute force.
-- ============================================================

CREATE TABLE IF NOT EXISTS otpcode (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose ENUM('login') NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_otpcode_user ON otpcode(user_id);
