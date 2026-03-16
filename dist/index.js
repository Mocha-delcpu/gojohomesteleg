"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
// Commands
const start_1 = require("./commands/start");
const admin_1 = require("./commands/admin");
// Actions (inline keyboard handlers)
const main_1 = require("./actions/main");
// Scenes
const scenes_1 = require("./scenes");
// Channel publishing service (bot needs to be passed to scenes)
const postProperty_1 = require("./scenes/postProperty");
if (!env_1.env.BOT_TOKEN) {
    logger_1.logger.error('BOT_TOKEN must be provided!');
    process.exit(1);
}
// Create a typed Telegraf instance using our custom context
const bot = new telegraf_1.Telegraf(env_1.env.BOT_TOKEN);
// ── Middleware ────────────────────────────────────────────────────────────────
// Session must come BEFORE stage
bot.use((0, telegraf_1.session)());
// Register wizard scenes
bot.use(scenes_1.stage.middleware());
// ──// Pass bot reference to postProperty scene for channel publishing
(0, postProperty_1.setBotInstance)(bot);
// ── Commands ──────────────────────────────────────────────────────────────────
(0, start_1.setupStartCommand)(bot);
(0, admin_1.setupAdminCommands)(bot);
// ── Inline Action Handlers ────────────────────────────────────────────────────
(0, main_1.setupActionHandlers)(bot);
// ── Global Error Handler ──────────────────────────────────────────────────────
bot.catch((err, ctx) => {
    logger_1.logger.error(`Error for update ${ctx.updateType}: ${err.message}`, err);
    ctx.reply('⚠️ Something went wrong. Please try /start again.').catch(() => { });
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
]).catch((err) => logger_1.logger.error('Failed to set commands:', err));
bot.launch().then(() => {
    logger_1.logger.info('✅ Gojo Homes Bot is live!');
});
// Enable graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
