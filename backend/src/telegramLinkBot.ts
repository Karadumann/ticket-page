import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const apiUrl = process.env.LINK_API_URL || 'http://localhost:5000/api/auth/link-telegram';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  const userId = msg.text?.trim();
  if (!userId) return;
  try {
    await axios.post(apiUrl, {
      userId,
      telegramId: msg.from?.id,
      telegramUsername: msg.from?.username,
    });
    bot.sendMessage(msg.chat.id, '✅ telegram account linked successfully');
  } catch (err: any) {
    bot.sendMessage(msg.chat.id, '❌ connection failed. please check the code');
  }
});

console.log('Telegram link bot is running...'); 