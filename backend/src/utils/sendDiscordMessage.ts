import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const token = process.env.DISCORD_BOT_TOKEN;

client.once('ready', () => {
});

if (token) {
  client.login(token).catch((err) => {
  });
} else {
}

export interface DiscordMessageOptions {
  type?: 'created' | 'reply' | 'status' | 'assigned' | 'deleted';
  title?: string;
  description?: string;
  url?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  buttonLabel?: string;
  color?: number;
  timestamp?: Date | number | string;
  ticketId?: string;
  category?: string;
  priority?: string;
  createdAt?: Date | string;
  avatarUrl?: string;
}

export async function sendDiscordMessage(discordId: string, options: DiscordMessageOptions | string) {
  if (!token) throw new Error('Discord bot token not set');
  if (!client.isReady()) await client.login(token);
  try {
    const user = await client.users.fetch(discordId);
    if (!user) return;

    let opts: DiscordMessageOptions;
    if (typeof options === 'string') {
      opts = { description: options };
    } else {
      opts = options;
    }

    let color = opts.color;
    let title = opts.title;
    let buttonLabel = opts.buttonLabel;
    switch (opts.type) {
      case 'created':
        color = color || 0x43a047;
        title = title || 'Ticket Created';
        buttonLabel = buttonLabel || 'View Ticket';
        break;
      case 'reply':
        color = color || 0x1976d2;
        title = title || 'New Reply to Your Ticket';
        buttonLabel = buttonLabel || 'View Ticket';
        break;
      case 'status':
        color = color || 0xfbc02d;
        title = title || 'Ticket Status Updated';
        buttonLabel = buttonLabel || 'View Ticket';
        break;
      case 'assigned':
        color = color || 0x8e24aa;
        title = title || 'Ticket Assigned to You';
        buttonLabel = buttonLabel || 'View Ticket';
        break;
      case 'deleted':
        color = color || 0xd32f2f;
        title = title || 'Ticket Deleted';
        buttonLabel = undefined;
        break;
      default:
        color = color || 0x5865F2;
        title = title || 'Ticket Notification';
    }

    // Ekstra alanlar
    const extraFields = [];
    if (opts.ticketId) extraFields.push({ name: 'Ticket ID', value: opts.ticketId, inline: true });
    if (opts.category) extraFields.push({ name: 'Category', value: opts.category, inline: true });
    if (opts.priority) extraFields.push({ name: 'Priority', value: opts.priority, inline: true });
    if (opts.createdAt) extraFields.push({ name: 'Created At', value: new Date(opts.createdAt).toLocaleString(), inline: true });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(opts.description || '')
      .setColor(color)
      .setTimestamp(opts.timestamp ? new Date(opts.timestamp) : new Date());
    if (opts.url) embed.setURL(opts.url);
    if (opts.fields && opts.fields.length > 0) embed.addFields(opts.fields);
    if (extraFields.length > 0) embed.addFields(extraFields);
    if (opts.avatarUrl) embed.setThumbnail(opts.avatarUrl);

    let components: any[] = [];
    if (opts.url && buttonLabel) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Link)
          .setURL(opts.url)
      );
      components = [row];
    }

    await user.send({ embeds: [embed], components });
  } catch (err) {
  }
}

if (require.main === module) {
  sendDiscordMessage('640143382907322368', {
    type: 'reply',
    title: 'New Reply to Your Ticket',
    description: 'Admin John replied to your ticket.\n\n**Message:**\nYour issue has been resolved!\n',
    url: 'https://example.com/ticket/123',
    fields: [
      { name: 'Replied By', value: 'Admin John', inline: true },
      { name: 'Date', value: new Date().toLocaleString(), inline: true }
    ],
    buttonLabel: 'View Ticket',
    color: 0x1976d2,
    timestamp: new Date()
  }).then(() => {
    // console.log('Test message sent successfully!');
    process.exit(0);
  }).catch(err => {
    // console.error('Failed to send test message:', err);
    process.exit(1);
  });
} 