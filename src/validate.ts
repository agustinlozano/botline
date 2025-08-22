import { NotificationRequest, Level } from "./telegram-notification-service";

export function isValidLevel(level: string): level is Level {
  return ["info", "warning", "error", "critical"].includes(level);
}

export function validateNotificationRequest(body: any): {
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
