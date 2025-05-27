import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;
if (token) {
  bot = new TelegramBot(token, { polling: false });
}

export async function sendTelegramMessage(telegramId: string, message: string) {
  if (!bot) throw new Error('Telegram bot token not set');
  try {
    await bot.sendMessage(telegramId, message);
  } catch (err) {
    console.error('Telegram DM error:', err);
  }
} 