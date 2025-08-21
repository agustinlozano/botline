import {
  TelegramNotificationService,
  NotificationRequest,
} from "../src/telegram-notification-service";

async function main() {
  console.log("send-test starting...");
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "Missing BOT_TOKEN or CHAT_ID in environment. See .env.example"
    );
    process.exit(1);
  }

  const svc = new TelegramNotificationService(botToken, chatId);

  const req: NotificationRequest = {
    service: "local-test",
    error: "manual_test",
    message: "This is a test notification sent from local send-test.ts",
    level: "info",
    timestamp: new Date().toISOString(),
    payload: { local: true },
  };

  try {
    await svc.notify(req);
    console.log("✅ Telegram notification sent (check your chat).");
  } catch (err) {
    console.error("❌ Failed to send Telegram notification:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
}

main();
