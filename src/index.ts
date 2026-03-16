import { Telegraf, session } from 'telegraf';
import { env } from './config/env';
import { logger } from './utils/logger';
import { MyContext } from './utils/types';

// Commands
import { setupStartCommand } from './commands/start';
import { setupAdminCommands } from './commands/admin';

// Actions (inline keyboard handlers)
import { setupActionHandlers } from './actions/main';

// Scenes
import { stage } from './scenes';

// Channel publishing service (bot needs to be passed to scenes)
import { setBotInstance } from './scenes/postProperty';

if (!env.BOT_TOKEN) {
  logger.error('BOT_TOKEN must be provided!');
  process.exit(1);
}

// Create a typed Telegraf instance using our custom context
const bot = new Telegraf<MyContext>(env.BOT_TOKEN);

// ── Middleware ────────────────────────────────────────────────────────────────
// Session must come BEFORE stage
bot.use(session());

// Register wizard scenes
bot.use(stage.middleware());

// ──// Pass bot reference to postProperty scene for channel publishing
setBotInstance(bot as any);

// ── Commands ──────────────────────────────────────────────────────────────────
setupStartCommand(bot);
setupAdminCommands(bot);

// ── Inline Action Handlers ────────────────────────────────────────────────────
setupActionHandlers(bot);

// ── Global Error Handler ──────────────────────────────────────────────────────
bot.catch((err: any, ctx) => {
  logger.error(`Error for update ${ctx.updateType}: ${err.message}`, err);
  ctx.reply('⚠️ Something went wrong. Please try /start again.').catch(() => {});
});

// ── Launch ────────────────────────────────────────────────────────────────────
bot.telegram.setMyCommands([
  { command: 'start', description: '🏠 Main Menu' },
  { command: 'language', description: '🌐 Change Language' },
  { command: 'back', description: '🔙 Go Back / Cancel' },
  { command: 'search', description: '🔍 Search Properties' },
  { command: 'post', description: '📢 Post a Property' },
  { command: 'latest', description: '🆕 Latest Listings' },
  { command: 'setchannel', description: '📡 Set posting channel (Admin)' }
]).catch((err) => logger.error('Failed to set commands:', err));

bot.launch().then(() => {
  logger.info('✅ Gojo Homes Bot is live!');
});

// Enable graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
