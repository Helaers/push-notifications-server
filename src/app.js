const express = require("express");
const { Pool } = require("pg");
const url = require("url");
const cors = require("cors");

const sendPushNotification = require("./push-notifications.js");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "https://push-notifications-app.onrender.com",
  })
);
app.use(express.json());

const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth?.split(":") ?? [];

console.log("params", params);
console.log("aut", auth);

const pool = new Pool({
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split("/")[1],
  // ssl: true, // Uncomment for local development. Needed for external db connection url.
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`Push notifications server running on port ${PORT}`);
});

// GET all tokens
app.get("/push-tokens", (req, res) => {
  pool.query("SELECT * FROM push_tokens", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

// POST token
app.post("/push-token", (req, res) => {
  const { token } = req.body;

  pool.query("SELECT * FROM push_tokens WHERE token = $1", [token], (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rows.length > 0) {
      return res.status(200).send(`Token already exists: ${token}`);
    }

    pool.query("INSERT INTO push_tokens (token) VALUES ($1)", [token], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send(`Token added: ${token}`);
    });
  });
});

// DELETE all tokens
app.delete("/push-tokens", (req, res) => {
  pool.query("DELETE FROM push_tokens", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).send("All tokens removed");
  });
});

// SEND notification
app.post("/send-notification", (req, res) => {
  const message = req.body;

  // Get all tokens
  pool.query("SELECT * FROM push_tokens", async (error, results) => {
    if (error) {
      throw error;
    }
    const pushTokens = results.rows.map((row) => row.token);
    const uniqueTokens = [...new Set(pushTokens)];

    if (uniqueTokens.length === 0) {
      res.status(200).send("No tokens to send notifications to");
      return;
    }

    await sendPushNotification(uniqueTokens, message);

    res.status(200).json(uniqueTokens);
  });
});

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);

  pool.query("CREATE TABLE IF NOT EXISTS push_tokens (id SERIAL PRIMARY KEY, token VARCHAR(255))", (error, results) => {
    if (error) {
      throw error;
    }
  });
});
