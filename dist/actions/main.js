"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupActionHandlers = void 0;
const menus_1 = require("../utils/menus");
const db_1 = require("../services/db");
const formatting_1 = require("../utils/formatting");
const env_1 = require("../config/env");
const setupActionHandlers = (bot) => {
    // ── Post Property ─────────────────────────────────────────────────────────
    bot.action('action_post_property', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.scene.enter('POST_PROPERTY_SCENE');
    });
    // ── Search Properties ─────────────────────────────────────────────────────
    bot.action('action_search', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.scene.enter('SEARCH_PROPERTY_SCENE');
    });
    // ── Switch Language ───────────────────────────────────────────────────────
    bot.action('action_language', async (ctx) => {
        ctx.session.language = ctx.session.language === 'am' ? 'en' : 'am';
        const lang = ctx.session.language;
        // Import dynamically to avoid circular dependencies if any
        const { getMainMenu } = require('../utils/menus');
        const { i18n } = require('../i18n');
        const t = i18n.get(lang);
        await ctx.answerCbQuery(t.languageChanged);
        await ctx.editMessageText(t.welcome.replace('*Gojo Homes*', '*Gojo Homes*'), {
            parse_mode: 'Markdown',
            ...getMainMenu(lang)
        });
    });
    // ── Latest Listings ───────────────────────────────────────────────────────
    bot.action('action_latest', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('🆕 Fetching the latest listings...');
        const listings = await (0, db_1.getLatestListings)(6);
        if (listings.length === 0) {
            await ctx.reply('No listings yet! Be the first to post one.', (0, menus_1.getMainMenu)());
            return;
        }
        for (const p of listings) {
            const caption = (0, formatting_1.formatListing)(p);
            const primaryChannel = env_1.env.CHANNEL_IDS.split(',')[0].trim().replace('@', '');
            const viewUrl = p.channel_message_id
                ? `https://t.me/${primaryChannel}/${p.channel_message_id}`
                : null;
            if (p.images && p.images.length > 0) {
                await ctx.replyWithPhoto(p.images[0], {
                    caption,
                    parse_mode: 'Markdown',
                    ...(viewUrl ? { reply_markup: { inline_keyboard: [[{ text: '👀 View Full Listing', url: viewUrl }]] } } : {}),
                });
            }
            else {
                await ctx.reply(caption, { parse_mode: 'Markdown' });
            }
        }
        await ctx.reply('Use /start to go back to the main menu.', (0, menus_1.getMainMenu)());
    });
    // ── Agency Pages ──────────────────────────────────────────────────────────
    bot.action('action_agencies', async (ctx) => {
        await ctx.answerCbQuery();
        const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
        await ctx.reply(`🏢 *Agency Pages*\n\n` +
            `Agencies can create a shareable profile like:\n` +
            `\`https://t.me/${botUsername}?start=agency_sunrise\`\n\n` +
            `Are you an agency? Contact us to get your profile set up.`, { parse_mode: 'Markdown' });
    });
    // ── Help ──────────────────────────────────────────────────────────────────
    bot.action('action_help', async (ctx) => {
        await ctx.answerCbQuery();
        const helpText = `❓ *Gojo Homes Help*\n\n` +
            `📢 *Post Property* — List your property step-by-step\n` +
            `🔍 *Search* — Find rentals by location, type, and budget\n` +
            `🆕 *Latest Listings* — Browse the newest properties\n` +
            `🏢 *Agency Pages* — Browse by broker/agency\n\n` +
            `*Shortcuts:*\n` +
            `/start — Main menu\n` +
            `/search — Search properties\n` +
            `/post — Post a property\n` +
            `/latest — Latest listings\n\n` +
            `Questions? Contact: @gojohomes\\_support`;
        await ctx.reply(helpText, { parse_mode: 'Markdown' });
    });
};
exports.setupActionHandlers = setupActionHandlers;
