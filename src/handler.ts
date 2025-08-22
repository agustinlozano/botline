import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  TelegramNotificationService,
  NotificationRequest,
  Level,
} from "./telegram-notification-service";

// Validation helper
function isValidLevel(level: string): level is Level {
  return ["info", "warning", "error", "critical"].includes(level);
}

function validateNotificationRequest(body: any): {
  valid: boolean;
  error?: string;
  data?: NotificationRequest;
} {
  if (!body) {
    return { valid: false, error: "Request body is required" };
  }

  const { service, error, message, level, timestamp, payload } = body;

  // Check required fields
  if (!service || typeof service !== "string") {
    return {
      valid: false,
      error: 'Field "service" is required and must be a string',
    };
  }

  if (!error || typeof error !== "string") {
    return {
      valid: false,
      error: 'Field "error" is required and must be a string',
    };
  }

  if (!message || typeof message !== "string") {
    return {
      valid: false,
      error: 'Field "message" is required and must be a string',
    };
  }

  if (!level || !isValidLevel(level)) {
    return {
      valid: false,
      error:
        'Field "level" is required and must be one of: info, warning, error, critical',
    };
  }

  // Validate optional fields
  if (timestamp !== undefined && timestamp !== null) {
    const timestampTest = new Date(timestamp);
    if (isNaN(timestampTest.getTime())) {
      return {
        valid: false,
        error:
          'Field "timestamp" must be a valid date string, number, or Date object',
      };
    }
  }

  if (
    payload !== undefined &&
    payload !== null &&
    typeof payload !== "object"
  ) {
    return { valid: false, error: 'Field "payload" must be an object or null' };
  }

  return {
    valid: true,
    data: {
      service,
      error,
      message,
      level,
      timestamp,
      payload: payload || null,
    },
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get environment variables
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    const requestToken = process.env.REQUEST_TOKEN;

    if (!botToken || !chatId || !requestToken) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ok: false,
          error:
            "Missing required environment variables: BOT_TOKEN, CHAT_ID and/or REQUEST_TOKEN",
        }),
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ok: false,
          error: "Invalid JSON in request body",
        }),
      };
    }

    // Validate request token
    const providedToken = event.headers["x-request-token"] || requestBody.token;
    if (!providedToken || providedToken !== requestToken) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ok: false,
          error: "Unauthorized: Invalid or missing request token",
        }),
      };
    }

    // Validate request
    const validation = validateNotificationRequest(requestBody);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ok: false,
          error: validation.error,
        }),
      };
    }

    // Initialize Telegram service and send notification
    const telegram = new TelegramNotificationService(botToken, chatId);
    await telegram.notify(validation.data!);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
      }),
    };
  } catch (error) {
    console.error("Error processing notification:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
    };
  }
};
