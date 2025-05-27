import { Client, GatewayIntentBits, Partials } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });

const token = process.env.DISCORD_BOT_TOKEN;
if (token && !client.isReady()) {
  client.login(token).catch(() => {});
}

export async function sendDiscordMessage(discordId: string, message: string) {
  if (!token) throw new Error('Discord bot token not set');
  if (!client.isReady()) await client.login(token);
  try {
    const user = await client.users.fetch(discordId);
    if (user) await user.send(message);
  } catch (err) {
    console.error('Discord DM error:', err);
  }
} 