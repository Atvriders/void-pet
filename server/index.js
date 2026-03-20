const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

// Determine DB path
const dbPath = fs.existsSync('/data') ? '/data/void.db' : './void.db';
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pets (
    username TEXT PRIMARY KEY,
    state    TEXT NOT NULL,
    updated  INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    username   TEXT PRIMARY KEY,
    care_score REAL NOT NULL,
    stage      TEXT NOT NULL,
    age        REAL NOT NULL,
    ascensions INTEGER NOT NULL,
    date       INTEGER NOT NULL
  )
`);

app.use(express.json());
app.use(cors());

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT l.username, l.care_score, l.stage, l.age, l.ascensions, l.date, p.updated as last_seen
       FROM leaderboard l
       LEFT JOIN pets p ON l.username = p.username
       ORDER BY l.care_score DESC LIMIT 50`
    ).all();
    const result = rows.map(row => ({
      username: row.username,
      careScore: row.care_score,
      stage: row.stage,
      age: row.age,
      ascensions: row.ascensions,
      date: row.date,
      lastSeen: row.last_seen ?? null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores
app.post('/api/scores', (req, res) => {
  try {
    const { username, careScore, stage, age, ascensions, date } = req.body;
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'invalid username' });
    }
    const careScoreNum  = Number(careScore);
    const ageNum        = Number(age);
    const ascensionsNum = Number(ascensions);
    const dateNum       = Number(date);
    if (!Number.isFinite(careScoreNum) || !Number.isFinite(ageNum) ||
        !Number.isFinite(ascensionsNum) || !Number.isFinite(dateNum)) {
      return res.status(400).json({ error: 'invalid numeric fields' });
    }
    const existing = db.prepare('SELECT care_score FROM leaderboard WHERE username = ?').get(username);
    if (!existing || careScoreNum > existing.care_score) {
      db.prepare(
        'INSERT OR REPLACE INTO leaderboard (username, care_score, stage, age, ascensions, date) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, careScoreNum, stage || '', ageNum, ascensionsNum, dateNum);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/scores/:username
app.delete('/api/scores/:username', (req, res) => {
  try {
    db.prepare('DELETE FROM leaderboard WHERE username = ?').run(req.params.username);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pet/:username
app.get('/api/pet/:username', (req, res) => {
  try {
    const row = db.prepare('SELECT state FROM pets WHERE username = ?').get(req.params.username);
    if (!row) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(JSON.parse(row.state));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pet/:username
app.put('/api/pet/:username', (req, res) => {
  try {
    db.prepare(
      'INSERT OR REPLACE INTO pets (username, state, updated) VALUES (?, ?, ?)'
    ).run(req.params.username, JSON.stringify(req.body), Date.now());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pet/:username
app.delete('/api/pet/:username', (req, res) => {
  try {
    db.prepare('DELETE FROM pets WHERE username = ?').run(req.params.username);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`void-pet API listening on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
});
