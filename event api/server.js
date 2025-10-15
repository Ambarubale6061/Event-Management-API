const express = require("express");
const app = express();
const pool = require("./db");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Event Management API is running!");
});

app.post("/events", async (req, res) => {
  try {
    const { title, start_time, location, capacity } = req.body;

    if (!title || !start_time || !location || !capacity) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newEvent = await pool.query(
      "INSERT INTO events (title, start_time, location, capacity) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, start_time, location, capacity]
    );

    res.status(201).json({ message: "Event created", event: newEvent.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/events", async (req, res) => {
  try {
    const allEvents = await pool.query("SELECT * FROM events");
    res.json(allEvents.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/events/:id/register", async (req, res) => {
  try {
    const eventId = req.params.id;
    const { user_id } = req.body;

    const event = await pool.query("SELECT * FROM events WHERE id=$1", [
      eventId,
    ]);
    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const already = await pool.query(
      "SELECT * FROM registrations WHERE user_id=$1 AND event_id=$2",
      [user_id, eventId]
    );
    if (already.rows.length > 0) {
      return res.status(400).json({ message: "Already registered" });
    }

    const count = await pool.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id=$1",
      [eventId]
    );
    const total = parseInt(count.rows[0].count);
    if (total >= event.rows[0].capacity) {
      return res.status(400).json({ message: "Event full" });
    }

    const reg = await pool.query(
      "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2) RETURNING *",
      [user_id, eventId]
    );

    res
      .status(201)
      .json({ message: "Registered successfully", data: reg.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/events/:eventId/registrations/:userId", async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const del = await pool.query(
      "DELETE FROM registrations WHERE event_id=$1 AND user_id=$2 RETURNING *",
      [eventId, userId]
    );
    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.json({ message: "Registration cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/events/:id/stats", async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await pool.query("SELECT * FROM events WHERE id=$1", [
      eventId,
    ]);
    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const count = await pool.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id=$1",
      [eventId]
    );
    const total = parseInt(count.rows[0].count);
    const remaining = event.rows[0].capacity - total;

    res.json({
      event_title: event.rows[0].title,
      total_registrations: total,
      remaining_capacity: remaining,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
