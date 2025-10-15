CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL
);
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);