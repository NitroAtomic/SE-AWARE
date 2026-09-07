-- ============================================================
-- Seed data - Juan Paolo Dente
-- Matches the modules already in the frontend prototypes.
-- Run this AFTER schema.sql.
-- ============================================================

USE se_aware;

INSERT INTO modules (module_title, description, module_type, category, slug) VALUES
  ('Phishing', 'Fraudulent messages built to look like they came from someone you trust.', 'Free', 'phishing', 'phishing'),
  ('Spear Phishing', 'A phishing attempt tailored specifically to you or your role.', 'Free', 'spear-phishing', 'spear-phishing'),
  ('Smishing', 'Scam text messages about deliveries, banks, or accounts.', 'Free', 'smishing', 'smishing'),
  ('Vishing', 'Scam phone calls asking for one-time codes or remote access.', 'Free', 'vishing', 'vishing'),
  ('Pretexting', 'A fabricated scenario used to get access or information.', 'Free', 'pretexting', 'pretexting'),
  ('Safe Practices for Remote Workers', 'Everyday habits that close most social engineering gaps.', 'Free', 'safe-practices', 'safe-practices'),
  ('Client Impersonation', 'Someone posing as your real client mid-project.', 'Premium', 'role-based', 'client-impersonation'),
  ('Invoice and Payment Scams', 'Spoofed payment confirmations and redirected invoices.', 'Premium', 'role-based', 'invoice-scams'),
  ('Fake Job and Recruiter Offers', 'Recruitment scams targeting freelancers and VAs.', 'Premium', 'role-based', 'fake-recruiters'),
  ('Secure Client Data Handling', 'Protecting client data, passwords, and files from exposure.', 'Premium', 'role-based', 'client-data');

-- One quiz per module
INSERT INTO quizzes (module_id, title, number_of_questions)
SELECT module_id, CONCAT(module_title, ' Quiz'), 0 FROM modules;

-- Example: Phishing quiz questions (repeat this pattern for the other 9
-- modules using content from your frontend's module data files)
INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id,
  'Which detail is the strongest phishing red flag?',
  JSON_ARRAY('The email has a company logo', "The sender address doesn't match the real company domain", 'The email was sent in the morning', 'The email includes an attachment'),
  1, 0
FROM quizzes q JOIN modules m ON m.module_id = q.module_id WHERE m.slug = 'phishing';

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id,
  'You get an urgent email saying your account will be suspended in 1 hour. What should you do first?',
  JSON_ARRAY('Click the link immediately to fix it', 'Reply asking for more details', 'Go to the official site directly instead of clicking the link', 'Forward it to a coworker'),
  2, 1
FROM quizzes q JOIN modules m ON m.module_id = q.module_id WHERE m.slug = 'phishing';

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, order_index)
SELECT q.quiz_id,
  "A generic greeting like 'Dear Valued Customer' is suspicious because",
  JSON_ARRAY("it's grammatically incorrect", 'legitimate companies you have an account with usually know your name', "it's too polite", 'it means the email is spam-filtered'),
  1, 2
FROM quizzes q JOIN modules m ON m.module_id = q.module_id WHERE m.slug = 'phishing';

UPDATE quizzes q
JOIN modules m ON m.module_id = q.module_id
SET q.number_of_questions = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.quiz_id)
WHERE m.slug = 'phishing';

-- TODO: repeat the same 3-row insert pattern above for the remaining 9
-- modules using the question text already written in the frontend prototype.

-- ============================================================
-- Create the first admin account manually after running this file:
--   1. Register a normal account through the site (or via POST /api/auth/register)
--   2. UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
-- There is no self-service way to become an admin, on purpose.
-- ============================================================
