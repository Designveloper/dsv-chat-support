# Chat Support

A modern chat support application with Slack integration.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js 20.x** or higher
- **Docker** and **Docker Compose**

### 1. Clone the Repository


```bash
git clone https://github.com/Designveloper/dsv-chat-support
cd dsv-chat-support
```

---

### 2. Environment Configuration

Each service has its own env file. Copy both examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- **`backend/.env`** — database, Slack, JWT, SMTP. Defaults are pre-filled for local dev; fill in Slack and SMTP after their setup steps.
- **`frontend/.env`** — frontend-only `VITE_*` vars. Defaults to `http://localhost:5173` for local dev.

---

### 3. Start the Local Database & Run Migrations

The project uses Docker Compose to spin up a MySQL database locally. Make sure **Docker** and **Docker Compose** are installed, then run:

```bash
docker-compose up -d db
```

This starts a MySQL 8.0 container using credentials from your `.env` file. On first startup, Docker automatically runs `db-migration.sql` to create all tables — no manual step required. Data is persisted in a named Docker volume (`mysql-data`).

To verify the database is ready:

```bash
docker-compose logs db
# Look for: mysqld: ready for connections
```

---

### 4. Slack Integration Setup

Before starting the application, you need a Slack app to enable the Slack integration.

**Create a Slack App**

- Go to [Slack API: Your Apps](https://api.slack.com/apps) and click **Create New App**.
- Choose **From scratch**, give your app a name, and select your workspace.

**Configure OAuth & Permissions**

Add the following OAuth scopes under **Bot Token Scopes**:

- `channels:history`
- `channels:manage`
- `channels:read`
- `channels:join`
- `chat:write`
- `chat:write.customize`
- `users:read`
- `users:read.email`
- `commands`

After adding scopes, click **Install App to Workspace**.

Copy the **Bot User OAuth Token** and add it to your `.env` as `SLACK_BOT_TOKEN`.

**Set the Redirect URL**

Under **OAuth & Permissions → Redirect URLs**, add:

```
https://<your-domain>/slack/oauth_redirect
```

> If running locally, use [ngrok](https://ngrok.com/) to expose your local backend: `ngrok http 3000`

**Enable Event Subscriptions**

- Go to the **Event Subscriptions** tab and enable it.
- Set the **Request URL** to:
  ```
  https://<your-domain>/slack/events
  ```

**Copy remaining credentials to `.env`**

```env
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_REDIRECT_URI=https://<your-domain>/slack/oauth_redirect
```

---

### 5. Start the Application

You can run the full stack (frontend + backend) with Docker Compose, or run each service individually for development.

#### Option A — Run everything with Docker Compose

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost](http://localhost)
- **Backend:** [http://localhost:3000](http://localhost:3000)

To stop all services:

```bash
docker-compose down
```

#### Option B — Run frontend and backend separately (recommended for development)

> **Environment for local dev:** NestJS reads `backend/.env` from the `backend/` folder. The frontend reads `frontend/.env`. Both were already copied in step 2 — no extra steps needed here.


**Backend:**

```bash
cd backend
npm install
npm run start:dev
```

The backend will be available at [http://localhost:3000](http://localhost:3000).

**Frontend** (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will be available at [http://localhost:5173](http://localhost:5173) (or as shown in the terminal output).

---

### 6. Connect Your Slack Workspace

After the app is running, log in and navigate to the dashboard. Use the **Connect Slack** option to link your workspace and select a channel for notifications.

---

## 🧩 Embedding the Chat Widget

To embed the chat widget on your website:

### 1. Build and Serve the Widget (Local Development)

The widget script (`chat-widget.js`) is **not available in dev mode** — it requires a production build. Run the following commands from the `frontend/` directory:

```bash
cd frontend

# Step 1 — build the main app
npm run build

# Step 2 — build the widget bundle
npm run build:widget

# Step 3 — serve the build output (available at http://localhost:4173)
npm run preview
```

> **Note:** You must complete all three steps in order. The widget URL (`http://localhost:4173`) only works after `preview` is running.

### 2. Add the Script to Your HTML Head

```html
<script
  src="{VITE_WIDGET_URL}/chat-widget.js"
  async
></script>
```

> Replace `{VITE_WIDGET_URL}` with the preview URL (e.g. `http://localhost:4173` locally, or your deployed frontend domain in production).

### 3. Add the Widget Element

```html
<chat-support-widget widgetid="your-widget-id"></chat-support-widget>
```

You can find your `widgetid` in your workspace settings.

### 4. Verify Installation

After adding both snippets, open your website and confirm the chat widget appears. If you encounter any issues, please contact our support team.

---

## 📢 Need Help?

Open an issue or contact the maintainers for support.
