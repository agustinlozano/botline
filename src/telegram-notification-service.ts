export type Level = "info" | "warning" | "error" | "critical";

export type NotificationRequest = {
  service: string;
  error: string;
  message: string;
  level: Level;
  timestamp?: string | number | Date;
  payload?: Record<string, unknown> | null;
};

export class TelegramNotificationService {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  private getSeverityEmoji(level: Level): string {
    switch (level) {
      case "info":
        return "💡";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "critical":
        return "🚨";
      default:
        return "🔔";
    }
  }

  private formatMessage(data: NotificationRequest): string {
    const timestamp = data.timestamp
      ? new Date(data.timestamp).toISOString()
      : new Date().toISOString();

    const emoji = this.getSeverityEmoji(data.level);

    // Escape HTML-sensitive characters
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let msg = `${emoji} <b>[${escapeHtml(
      data.level.toUpperCase()
    )}]</b> from <b>${escapeHtml(data.service)}</b>\n\n`;
    msg += data.error ? `<b>Error:</b> ${escapeHtml(data.error)}\n` : "";
    msg += `<b>Message:</b> ${data.message}\n`;
    msg += `<b>Timestamp:</b> ${escapeHtml(timestamp)}\n`;

    if (data.payload) {
      const json = JSON.stringify(data.payload, null, 2);
      msg += `\n<b>Payload:</b>\n<pre>${escapeHtml(json)}</pre>`;
    }

    return msg;
  }

  private async sendMessage(text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send Telegram message: ${err}`);
    }
  }

  async notify(data: NotificationRequest): Promise<void> {
    const formatted = this.formatMessage(data);
    await this.sendMessage(formatted);
  }
}
