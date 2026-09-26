-- =============================================================
-- Support Ticket Management System - MySQL schema
-- =============================================================
-- Create the database first if needed (skip on managed cloud
-- databases that already provide one):
--   CREATE DATABASE support_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE support_tickets;
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- users: customers and support agents
-- -------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt hash, never plain text
  role          ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),               -- login lookup by email
  KEY idx_users_role (role)                        -- "list all agents"
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- tickets: one user (customer) -> many tickets
--          one agent -> many assigned tickets
-- -------------------------------------------------------------
CREATE TABLE tickets (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  subject     VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority    ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status      ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to INT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tickets_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_assignee
    FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
  -- Indexes for the most common filters / sorts
  KEY idx_tickets_user_created (user_id, created_at),   -- customer dashboard
  KEY idx_tickets_status_created (status, created_at),  -- agent filter by status
  KEY idx_tickets_priority (priority),
  KEY idx_tickets_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- ticket_comments: one ticket -> many comments
-- -------------------------------------------------------------
CREATE TABLE ticket_comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  comment    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  KEY idx_comments_ticket_created (ticket_id, created_at)  -- load a ticket's thread in order
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
