import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TelegramNotificationService } from "./telegram-notification-service";
import { validateNotificationRequest } from "./validate";

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
