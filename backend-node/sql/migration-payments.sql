ALTER TABLE users
  ADD COLUMN stripe_customer_id VARCHAR(255) NULL UNIQUE,
  ADD COLUMN stripe_subscription_id VARCHAR(255) NULL UNIQUE,
  ADD COLUMN subscription_current_period_end TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS payment_events (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
