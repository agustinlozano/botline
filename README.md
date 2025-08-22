# Telegram Notification Lambda

A serverless AWS Lambda function that sends structured notifications to Telegram using TypeScript and the Serverless Framework.

## Features

- 🚀 AWS Lambda function with API Gateway integration
- 📱 Telegram Bot API integration for notifications
- 🎯 TypeScript with strict typing
- 📊 Structured notification format with different severity levels
- 🔧 Environment-based configuration
- ⚡ Fast deployment with esbuild bundling

## Project Structure

```
├── src/
│   ├── telegram-notification-service.ts  # Telegram service class
│   └── handler.ts                      # Lambda handler
├── serverless.yml                      # Serverless configuration
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
└── build.mjs                          # Build script
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Telegram Bot

1. **Create a Telegram Bot:**

   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Save the **Bot Token** provided

2. **Get Chat ID:**
   - Add your bot to a chat or send a direct message
   - Send a test message to your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID in the response (it's the `id` field in the `chat` object)

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
BOT_TOKEN=your_telegram_bot_token_here
CHAT_ID=your_chat_id_here
REQUEST_TOKEN=your_secure_token_here
```

You can generate a secure token using:

```bash
openssl rand -hex 32
```

Set the output as your `REQUEST_TOKEN` value.

**Important:** Make sure your `.env` file is in `.gitignore` to avoid committing sensitive data.

### 4. Deploy

```bash
# Deploy to AWS
pnpm deploy

# Or just deploy without building (if already built)
serverless deploy
```

## Usage

### API Endpoint

After deployment, you'll get an API Gateway endpoint. Send POST requests to:

```
POST https://your-api-id.execute-api.us-east-1.amazonaws.com/notify
```

#### Token Validation

All requests must include a valid token for authentication. You can provide the token in either:

- The `x-request-token` header
- The `token` field in the request body

Example with header:

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/notify \
  -H "Content-Type: application/json" \
  -H "x-request-token: your_secure_token_here" \
  -d '{
    "service": "user-service",
    "error": "authentication_failed",
    "message": "Invalid JWT token provided",
    "level": "warning",
    "payload": {
      "user_id": "12345",
      "ip": "192.168.1.100"
    }
  }'
```

Or with token in body:

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/notify \
  -H "Content-Type: application/json" \
  -d '{
    "service": "user-service",
    "error": "authentication_failed",
    "message": "Invalid JWT token provided",
    "level": "warning",
    "token": "your_secure_token_here",
    "payload": {
      "user_id": "12345",
      "ip": "192.168.1.100"
    }
  }'
```

### Request Format

```json
{
  "service": "payments-api",
  "error": "db_connection_failed",
  "message": "Database unreachable",
  "level": "critical",
  "timestamp": "2024-08-21T10:30:00Z",
  "payload": {
    "host": "db1.prod",
    "attempts": 3
  }
}
```

### Required Fields

- `service` (string): Service name that triggered the notification
- `error` (string): Error identifier/slug
- `message` (string): Human-readable error message
- `level` (string): One of `"info"`, `"warning"`, `"error"`, `"critical"`

### Optional Fields

- `timestamp` (string|number|Date): Custom timestamp (defaults to current time)
- `payload` (object|null): Additional context data

### Example with curl

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/notify \
  -H "Content-Type: application/json" \
  -d '{
    "service": "user-service",
    "error": "authentication_failed",
    "message": "Invalid JWT token provided",
    "level": "warning",
    "payload": {
      "user_id": "12345",
      "ip": "192.168.1.100"
    }
  }'
```

### Response Format

**Success:**

```json
{ "ok": true }
```

**Error (invalid token):**

```json
{
  "ok": false,
  "error": "Unauthorized: Invalid or missing request token"
}
```

**Error (validation):**

```json
{
  "ok": false,
  "error": "Field \"level\" is required and must be one of: info, warning, error, critical"
}
```

## Notification Levels

Each level includes a corresponding emoji in the Telegram message:

- 💡 **info**: Informational messages
- ⚠️ **warning**: Warning conditions
- ❌ **error**: Error conditions
- 🚨 **critical**: Critical failures

## Message Format

The Telegram message will be formatted as:

```html
🚨 <b>[CRITICAL]</b> from <b>payments-api</b>

<b>Error:</b> db_connection_failed <b>Message:</b> Database unreachable
<b>Timestamp:</b> 2024-08-21T10:30:00.000Z

<b>Payload:</b>
<pre>
{
  "host": "db1.prod",
  "attempts": 3
}</pre
>
```

## Development

### Local Build

```bash
pnpm build
```

### Scripts

- `pnpm build`: Build the TypeScript code with esbuild
- `pnpm deploy`: Build and deploy to AWS
- `pnpm dev`: Deploy without building (for quick iterations)

## Error Handling

The service handles various error scenarios:

- **Invalid JSON**: Returns 400 with error message
- **Missing required fields**: Returns 400 with validation error
- **Invalid level**: Returns 400 with allowed values
- **Missing environment variables**: Returns 500 with configuration error
- **Telegram API failures**: Returns 500 with Telegram error details

## Configuration

### Environment Variables

- `BOT_TOKEN`: Your Telegram bot token from BotFather
- `CHAT_ID`: The chat ID where notifications should be sent
- `REQUEST_TOKEN`: Secure token required for API requests

### AWS Configuration

The `serverless.yml` file is configured for:

- **Runtime**: Node.js 20.x
- **Region**: us-east-1 (modify as needed)
- **HTTP API**: POST endpoint at `/notify`

## Troubleshooting

### Common Issues

1. **"Cannot find BOT_TOKEN or CHAT_ID"**

   - Ensure environment variables are set in your `.env` file
   - Check that serverless is reading the environment variables correctly

2. **"Failed to send Telegram message"**

   - Verify your bot token is correct
   - Ensure the chat ID is valid and the bot has access to send messages
   - Check if the bot was removed from the chat

3. **"Invalid JSON in request body"**
   - Ensure you're sending valid JSON
   - Check Content-Type header is set to `application/json`

### Testing Your Setup

Send a test notification:

```bash
curl -X POST https://your-endpoint.amazonaws.com/notify \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test",
    "error": "setup_test",
    "message": "Testing notification setup",
    "level": "info"
  }'
```

## License

ISC
