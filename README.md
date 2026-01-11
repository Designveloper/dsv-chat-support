# Chat Support

A modern chat support application with Slack integration.

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Designveloper/dsv-chat-support
cd dsv-chat-support
```

### 2. Environment Configuration

Copy the example environment file and update it with your secrets:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```env
# Database
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# Slack configuration
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_REDIRECT_URI=your-slack-redirect-uri

# JWT signing key
JWT_SECRET=your-jwt-secret

# SMTP configuration (used for sending verification codes)
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-port
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM=your-smtp-from

```

---

## 🔗 Slack Integration Setup

To enable Slack integration:

**Create a Slack App**

- Go to [Slack API: Your Apps](https://api.slack.com/apps) and click "Create New App".
- Choose "From scratch" and give your app a name and workspace.

**Configure OAuth & Permissions**

- Add the following OAuth scopes:
  - `channels:history`
  - `channels:manage`
  - `channels:read`
  - `channels:join`
  - `chat:write`
  - `chat:write.customize`
  - `users:read`
  - `users:read.email`
  - `commands`

 - After setting up the OAuth scopes, you need to install the app to your workspace.
 - Copy the **Bot User OAuth Token** from the Slack app settings to set `SLACK_BOT_TOKEN` in your `.env` file.
 - Set the **Redirect URL** to:
  ```
  https://<your-domain>/slack/oauth_redirect
  ```
  (If you are running locally, use ngrok to expose your local server first)

**Enable Event Subscriptions**

- Go to the **Event Subscriptions** tab in your Slack app settings.
- Enable events.
- Set the **Request URL** to:
  ```
  https://<your-domain>/slack/events
  ```
  (If you are running locally, use ngrok to expose your local server first)

**Get your credentials**

- Copy the **Client ID**, **Client Secret**, and **Signing Secret** from your Slack app settings.
- Add them to your [.env](http://_vscodecontentref_/1) file:
  ```
  SLACK_CLIENT_ID=your-client-id
  SLACK_CLIENT_SECRET=your-client-secret
  SLACK_SIGNING_SECRET=your-signing-secret
  SLACK_REDIRECT_URI=https://<your-domain>/slack/oauth_redirect
  ```

**Connect Slack in the Dashboard**

- After running the app, log in and use the dashboard to connect your Slack workspace and select a channel for notifications.

For more details, see [Slack API documentation](https://api.slack.com/).

---

## 🚀 Running with Docker

This project uses Docker Compose to run both the frontend and backend services.

### 1. Build and Start the Services

Make sure Docker and Docker Compose are installed on your machine.

```bash
docker-compose up --build
```

- The **frontend** will be available at [http://localhost](http://localhost)
- The **backend** will be available at [http://localhost:3000](http://localhost:3000)

### 2. Environment Variables

The backend service uses environment variables from your `.env` file. Ensure all required variables are set.

### 3. Stopping the Services

To stop the running containers:

```bash
docker-compose down
```

---

## 🧩 Embedding the Chat Widget

To embed the chat widget on your website, follow these steps:

### 1. Add the Script to Your HTML Head

Place this script tag in the `<head>` section of your HTML file (e.g., `index.html`):

```html
<script
  src="https://chat-support-7j2g.onrender.com/chat-widget.js"
  async
></script>
```

> Replace the `src` URL with your deployed server address if self-hosting.

### 2. Add the Widget Element

Insert the following custom element where you want the chat widget to appear, replacing `your-widget-id` with your actual widget ID:

```html
<chat-support-widget widgetid="your-widget-id"></chat-support-widget>
```

You can find your `widgetid` in your workspace settings.

### 3. Verify Installation

After adding both code snippets, check your website to ensure the chat widget appears.  
If you encounter any issues, please contact our support team.

---

## 📢 Need Help?

Open an issue or contact the maintainers for support.
