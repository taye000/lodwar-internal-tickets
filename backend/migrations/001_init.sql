CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tickets (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status      ticket_status   NOT NULL DEFAULT 'open',
  priority    ticket_priority NOT NULL DEFAULT 'medium',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status ON tickets(status);