-- =============================================================
-- Sample data. Run after schema.sql.
--
-- Every seeded account uses the demo password:  Password123!
-- (stored below as a bcrypt hash - never as plain text)
-- =============================================================

INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Alice Agent',   'agent@example.com',  '$2b$10$ItxYzn2SyHA7fv/CjQzd9.KUwwIhYSy0P18p7mVtOflWl0b8IgdCm', 'agent'),
  (2, 'Bob Support',   'agent2@example.com', '$2b$10$ItxYzn2SyHA7fv/CjQzd9.KUwwIhYSy0P18p7mVtOflWl0b8IgdCm', 'agent'),
  (3, 'Carol Customer','carol@example.com',  '$2b$10$ItxYzn2SyHA7fv/CjQzd9.KUwwIhYSy0P18p7mVtOflWl0b8IgdCm', 'customer'),
  (4, 'Dave Customer', 'dave@example.com',   '$2b$10$ItxYzn2SyHA7fv/CjQzd9.KUwwIhYSy0P18p7mVtOflWl0b8IgdCm', 'customer');

INSERT INTO tickets (id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at) VALUES
  (1, 3, 'Cannot log in to my account',
      'I reset my password twice but the login page still says invalid credentials.',
      'high', 'open', NULL, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  (2, 3, 'Invoice shows the wrong amount',
      'My March invoice charged me for 5 seats, but we only have 3 users.',
      'medium', 'in_progress', 1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),
  (3, 3, 'Feature request: dark mode',
      'It would be great to have a dark theme for the dashboard.',
      'low', 'resolved', 2, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 5 DAY),
  (4, 4, 'Website is down',
      'Our public site returns a 502 error since this morning.',
      'urgent', 'open', 1, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 4 HOUR),
  (5, 4, 'How do I export my data?',
      'I need a CSV export of all my orders for accounting.',
      'low', 'closed', 2, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY),
  (6, 4, 'Email notifications not arriving',
      'I stopped receiving order confirmation emails last week.',
      'medium', 'open', NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

INSERT INTO ticket_comments (ticket_id, user_id, comment, created_at) VALUES
  (2, 1, 'Thanks Carol, I am checking the billing records now.', NOW() - INTERVAL 1 DAY),
  (2, 3, 'Thank you! Let me know if you need any screenshots.', NOW() - INTERVAL 20 HOUR),
  (3, 2, 'Dark mode has been added to our roadmap. Marking as resolved.', NOW() - INTERVAL 5 DAY),
  (4, 1, 'We are investigating the outage with the hosting team.', NOW() - INTERVAL 4 HOUR),
  (5, 2, 'You can export from Settings > Data > Export CSV.', NOW() - INTERVAL 19 DAY),
  (5, 4, 'Found it, thanks!', NOW() - INTERVAL 18 DAY);
