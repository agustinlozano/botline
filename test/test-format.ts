import {
  TelegramNotificationService,
  NotificationRequest,
} from "../src/telegram-notification-service";

// This is a simple test script to verify the notification formatting
// You can run this locally to see how messages will be formatted

const testData: NotificationRequest = {
  service: "payments-api",
  error: "db_connection_failed",
  message: "Database unreachable",
  level: "critical",
  payload: {
    host: "db1.prod",
    attempts: 3,
    lastError: "Connection timeout after 30s",
  },
};

// Mock service that only logs the formatted message instead of sending
class MockTelegramService extends TelegramNotificationService {
  constructor() {
    super("mock_token", "mock_chat_id");
  }

  public async testNotify(data: NotificationRequest): Promise<void> {
    const formatted = (this as any).formatMessage(data);
    console.log("Formatted Telegram message:");
    console.log("=".repeat(50));
    console.log(formatted);
    console.log("=".repeat(50));
  }
}

async function testFormatting() {
  const service = new MockTelegramService();

  console.log("Testing notification formatting...\n");

  const levels: Array<NotificationRequest["level"]> = [
    "info",
    "warning",
    "error",
    "critical",
  ];

  for (const level of levels) {
    const testCase = { ...testData, level };
    console.log(`\n--- ${level.toUpperCase()} Level ---`);
    await service.testNotify(testCase);
  }
}

// Run the test
testFormatting().catch(console.error);
