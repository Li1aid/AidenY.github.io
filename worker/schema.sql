-- Aiden Portfolio — chatbot conversation log schema
-- Run once after creating the D1 database:
--   cd worker
--   npx wrangler d1 execute aiden-portfolio-chats --remote --file=./schema.sql

DROP TABLE IF EXISTS conversations;

CREATE TABLE conversations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  user_msg    TEXT NOT NULL,
  bot_reply   TEXT NOT NULL,
  language    TEXT,
  country     TEXT,
  city        TEXT,
  provider    TEXT,
  signal_tags TEXT,
  referer     TEXT,
  user_agent  TEXT
);

CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_country ON conversations(country);
CREATE INDEX idx_conversations_language ON conversations(language);
