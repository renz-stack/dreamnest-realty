# DreamNest Realty

Sample real estate website with a SQLite database for the Contact Us form.

## Requirements

- [Node.js](https://nodejs.org) 22.13 or newer (uses the built-in `node:sqlite` module)

## Run

```bash
npm install
npm start
```

- Website: http://localhost:3000
- Admin inbox: http://localhost:3000/admin.html (default key: `admin123`)

To use a different admin key (PowerShell):

```powershell
$env:ADMIN_KEY = "your-secret-key"; npm start
```

## Deploy to Render

1. Push this repository to GitHub.
2. On [render.com](https://render.com), choose **New → Blueprint** and select the repository.
   Render reads `render.yaml` and generates a random `ADMIN_KEY`.
3. Find the admin key under the service's **Environment** tab.

> On Render's free plan the disk is temporary: the SQLite database is wiped on every
> redeploy or restart. To keep messages, attach a persistent disk (paid plan) mounted
> at e.g. `/var/data` and set `DATA_DIR=/var/data`.

## Database

The database file is created automatically at `data/realestate.db`.

Table `contact_messages`:

| Column     | Type    | Notes                          |
|------------|---------|--------------------------------|
| id         | INTEGER | Primary key                    |
| name       | TEXT    | Required                       |
| email      | TEXT    | Required                       |
| phone      | TEXT    | Optional                       |
| subject    | TEXT    | "Buying a property", etc.      |
| message    | TEXT    | Required, 10–5000 characters   |
| status     | TEXT    | `new`, `read` or `replied`     |
| created_at | TEXT    | UTC timestamp                  |

## API

| Method | Endpoint             | Auth              | Description              |
|--------|----------------------|-------------------|--------------------------|
| POST   | `/api/contact`       | —                 | Submit a contact message |
| GET    | `/api/messages`      | `X-Admin-Key`     | List all messages        |
| PATCH  | `/api/messages/:id`  | `X-Admin-Key`     | Update status            |
| DELETE | `/api/messages/:id`  | `X-Admin-Key`     | Delete a message         |
