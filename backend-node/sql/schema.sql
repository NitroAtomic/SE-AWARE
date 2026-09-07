-- ============================================================
-- SE-AWARE — MySQL Database Schema
-- Created by: Juan Paolo Dente
-- Target: Node.js + Express + MySQL (as documented in the SE-AWARE README)
-- Maps to the ERD in Chapter III (System Design → Database Design)
-- ============================================================

CREATE DATABASE IF NOT EXISTS se_aware CHARACTER SET utf8mb4;
USE se_aware;

-- ============================================================
-- 1. USER
-- ============================================================
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  subscription_type ENUM('Free', 'Premium') NOT NULL DEFAULT 'Free',
  subscription_status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. MODULE
-- ============================================================
CREATE TABLE modules (
  module_id INT AUTO_INCREMENT PRIMARY KEY,
  module_title VARCHAR(255) NOT NULL,
  description TEXT,
  module_type ENUM('Free', 'Premium') NOT NULL DEFAULT 'Free',
  category VARCHAR(100),
  video_url VARCHAR(500),
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. QUIZ (one per module)
-- ============================================================
CREATE TABLE quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  number_of_questions INT NOT NULL DEFAULT 3,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

-- Supporting table, not in the original ERD, but required to actually run
-- a quiz: the individual questions and answer options.
CREATE TABLE quiz_questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  options JSON NOT NULL,
  correct_option_index INT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. QUIZ RESULT
-- ============================================================
CREATE TABLE quiz_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  date_completed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. CYBERSECURITY AWARENESS ASSESSMENT
-- ============================================================
CREATE TABLE assessments (
  assessment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  awareness_level VARCHAR(20) NOT NULL,
  level_key VARCHAR(20) NOT NULL,
  by_topic JSON NOT NULL,
  weak_areas JSON NOT NULL,
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. PROGRESS
-- ============================================================
CREATE TABLE progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module_id INT NOT NULL,
  completion_status ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
  completion_date TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_module (user_id, module_id)
);

-- ============================================================
-- 7. ADMINISTRATOR
-- Note: implemented as users.role = 'admin', not a separate table.
-- See README note in server.js for the same reasoning as the Supabase
-- version: one login system (users + password_hash here) is safer than
-- maintaining a second, parallel admin login system.
-- ============================================================

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_quizzes_module ON quizzes(module_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
