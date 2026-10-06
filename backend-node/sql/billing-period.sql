-- ============================================================
-- Adds the billing period to the users table.
--
-- Premium can be paid monthly or yearly. Both unlock exactly the same
-- features, so the only thing worth storing is which one was chosen and
-- when the plan next renews. The renewal date already had a home in
-- subscription_current_period_end; this adds the period itself.
--
-- Run this once against the se_aware database. The site works without it -
-- the backend notices the column is missing, logs a warning and records the
-- renewal date anyway - but the chosen period is not kept until you do.
--
-- In MySQL Workbench: open this file, select all, and run.
-- ============================================================

USE se_aware;

ALTER TABLE users
  ADD COLUMN subscription_period ENUM('monthly', 'yearly') NULL DEFAULT NULL
  AFTER subscription_status;

-- Anyone already on Premium before this column existed was on the monthly
-- price, since that was the only one offered. Free accounts keep NULL,
-- because a plan nobody is paying for has no billing period.
--
-- The WHERE clause is on subscription_type, which Workbench's safe update
-- mode rejects unless it can see a key column. user_id > 0 satisfies that
-- without changing which rows are touched.
UPDATE users
  SET subscription_period = 'monthly'
  WHERE subscription_type = 'Premium' AND user_id > 0;
