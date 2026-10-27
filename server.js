const express = require("express");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

if (process.env.NODE_ENV === "production" && !process.env.ADMIN_KEY) {
  console.error("ADMIN_KEY must be set in production.");
  process.exit(1);
}

// ===== Database =====
// DATA_DIR lets a host point the database at a persistent disk
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "realestate.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    subject    TEXT,
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertMessage = db.prepare(
  "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
);
const listMessages = db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC");
const updateStatus = db.prepare("UPDATE contact_messages SET status = ? WHERE id = ?");
const deleteMessage = db.prepare("DELETE FROM contact_messages WHERE id = ?");

// ===== App =====
const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const SUBJECTS = ["Buying a property", "Renting a property", "Selling my property", "Property valuation", "Other"];
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const str = (v) => (typeof v === "string" ? v.trim() : "");

function validateContact(body) {
  const data = {
    name: str(body.name),
    email: str(body.email).toLowerCase(),
    phone: str(body.phone),
    subject: str(body.subject),
    message: str(body.message),
  };
  const errors = {};
  if (!data.name || data.name.length > 100) errors.name = "Please enter your name (max 100 characters)";
  if (!isEmail(data.email) || data.email.length > 200) errors.email = "Please enter a valid email";
  if (data.phone && !/^[\d\s()+-]{7,20}$/.test(data.phone)) errors.phone = "Invalid phone number";
  if (!SUBJECTS.includes(data.subject)) data.subject = "Other";
  if (data.message.length < 10 || data.message.length > 5000) errors.message = "Message must be 10–5000 characters";
  return { data, errors };
}

// Public: submit the contact form
app.post("/api/contact", (req, res) => {
  const { data, errors } = validateContact(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const result = insertMessage.run(data.name, data.email, data.phone || null, data.subject, data.message);
  res.status(201).json({ id: Number(result.lastInsertRowid), message: "Message received" });
});

// Admin: requires the X-Admin-Key header
function requireAdmin(req, res, next) {
  if (req.get("X-Admin-Key") !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/messages", requireAdmin, (req, res) => {
  res.json(listMessages.all());
});

app.patch("/api/messages/:id", requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!["new", "read", "replied"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const result = updateStatus.run(status, Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.delete("/api/messages/:id", requireAdmin, (req, res) => {
  const result = deleteMessage.run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`DreamNest running at http://localhost:${PORT}`);
  console.log(`Admin inbox:        http://localhost:${PORT}/admin.html`);
  if (!process.env.ADMIN_KEY) console.warn('Using default admin key "admin123" — set ADMIN_KEY to change it.');
});
