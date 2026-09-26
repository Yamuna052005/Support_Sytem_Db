-- =============================================================
-- Example queries (section 8 of the assessment + extras)
-- =============================================================

-- 1) All OPEN tickets with the customer's name and email.
--    JOIN tickets -> users on the foreign key, filter by status.
--    Uses idx_tickets_status_created for both the WHERE and ORDER BY.
SELECT
  t.id,
  t.subject,
  t.priority,
  t.status,
  t.created_at,
  u.name  AS customer_name,
  u.email AS customer_email
FROM tickets t
INNER JOIN users u ON u.id = t.user_id
WHERE t.status = 'open'
ORDER BY t.created_at DESC;

-- Check the plan: should show "ref" access on idx_tickets_status_created
-- for tickets and "eq_ref" on PRIMARY for users - not a full table scan ("ALL").
EXPLAIN FORMAT=TRADITIONAL
SELECT t.id, t.subject, u.name, u.email
FROM tickets t
INNER JOIN users u ON u.id = t.user_id
WHERE t.status = 'open'
ORDER BY t.created_at DESC;

-- 2) Ticket list with customer and (optional) assigned agent.
--    LEFT JOIN because assigned_to may be NULL.
SELECT
  t.id, t.subject, t.status, t.priority,
  c.name AS customer_name,
  a.name AS assigned_agent
FROM tickets t
INNER JOIN users c ON c.id = t.user_id
LEFT JOIN users a  ON a.id = t.assigned_to
ORDER BY t.updated_at DESC;

-- 3) Ticket counts per status (agent dashboard statistics).
SELECT status, COUNT(*) AS total
FROM tickets
GROUP BY status;

-- 4) Workload per agent (open + in progress tickets).
SELECT a.id, a.name, COUNT(t.id) AS active_tickets
FROM users a
LEFT JOIN tickets t
  ON t.assigned_to = a.id AND t.status IN ('open', 'in_progress')
WHERE a.role = 'agent'
GROUP BY a.id, a.name
ORDER BY active_tickets DESC;

-- 5) A ticket's conversation thread with author details.
SELECT c.id, c.comment, c.created_at, u.name AS author, u.role AS author_role
FROM ticket_comments c
INNER JOIN users u ON u.id = c.user_id
WHERE c.ticket_id = 1
ORDER BY c.created_at ASC;
