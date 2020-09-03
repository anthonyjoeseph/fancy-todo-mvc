-- USERS
CREATE TABLE "users"
(
  "id"        SERIAL PRIMARY KEY,
  "email"     TEXT        NOT NULL,
  "password"  TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  UNIQUE(email)
);

-- TODOS
CREATE TABLE "todos"
(
  "id"          SERIAL PRIMARY KEY,
  "user_id"     INTEGER     NOT NULL,
  "text"        TEXT        NOT NULL,
  "completed"   BOOL        DEFAULT FALSE NOT NULL,
  CONSTRAINT "todos_user_fk"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
