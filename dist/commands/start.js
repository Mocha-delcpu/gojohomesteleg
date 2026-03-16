"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupStartCommand = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const db_1 = require("../services/db");
const formatting_1 = require("../utils/formatting");
const menus_1 = require("../utils/menus");
const db_2 = require("../services/db");
const i18n_1 = require("../i18n");
const setupStartCommand = (bot) => {
    // ── /language Command ──────────────────────────────────────────────────────
    bot.command('language', async (ctx) => {
        ctx.session.language = ctx.session.language === 'am' ? 'en' : 'am';
        const lang = ctx.session.language;
        const t = i18n_1.i18n.get(lang);
        await ctx.reply(t.languageChanged, (0, menus_1.getMainMenu)(lang));
    });
    // ── /back Command ──────────────────────────────────────────────────────────
    bot.command('back', async (ctx) => {
        if (ctx.scene) {
            await ctx.scene.leave();
        }
        const lang = ctx.session?.language || 'en';
        const t = i18n_1.i18n.get(lang);
        await ctx.reply('🔙', { reply_markup: { remove_keyboard: true } });
        await ctx.reply(t.welcome.replace('*Gojo Homes*', '*Gojo Homes*'), { parse_mode: 'Markdown', ...(0, menus_1.getMainMenu)(lang) });
    });
    bot.start(async (ctx) => {
        try {
            // @ts-ignore - payload is available in start handler
            const payload = ctx.payload || '';
            // ── Deep Link: Pre-filled Search ─────────────────────────────────────
            // Format: search_<location>_<minPrice>_<maxPrice>_<type>
            if (payload.startsWith('search_')) {
                const parts = payload.split('_');
                if (parts.length >= 4) {
                    const type = parts[parts.length - 1];
                    let minPrice = 0;
                    let maxPrice = 0;
                    let locationParts = [];
                    if (parts.length >= 5 && !isNaN(parseInt(parts[parts.length - 3], 10))) {
                        maxPrice = parseInt(parts[parts.length - 2], 10);
                        minPrice = parseInt(parts[parts.length - 3], 10);
                        locationParts = parts.slice(1, parts.length - 3);
                    }
                    else {
                        maxPrice = parseInt(parts[parts.length - 2], 10);
                        locationParts = parts.slice(1, parts.length - 2);
                    }
                    const location = locationParts.join(' ');
                    if (!isNaN(maxPrice)) {
                        await ctx.reply(`🔍 Running your shared search: *${type}* in *${location}* between *${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} ETB*...`, { parse_mode: 'Markdown' });
                        // Import here to avoid circular deps
                        const { searchProperties } = require('../services/db');
                        const { formatListing: fl } = require('../utils/formatting');
                        const results = await searchProperties(location, type, minPrice, maxPrice);
                        if (results.length === 0) {
                            await ctx.reply(`😔 No results found. Try a broader search — use /start to open the menu.`);
                        }
                        else {
                            await ctx.reply(`✅ Found *${results.length}* listing(s):`, { parse_mode: 'Markdown' });
                            const primaryChannel = env_1.env.CHANNEL_IDS.split(',')[0].trim().replace('@', '');
                            for (const p of results.slice(0, 5)) {
                                const caption = fl(p);
                                const viewUrl = p.channel_message_id
                                    ? `https://t.me/${primaryChannel}/${p.channel_message_id}`
                                    : null;
                                if (p.images?.length > 0) {
                                    await ctx.replyWithPhoto(p.images[0], {
                                        caption, parse_mode: 'Markdown',
                                        ...(viewUrl ? { reply_markup: { inline_keyboard: [[{ text: '👀 View Listing', url: viewUrl }]] } } : {}),
                                    });
                                }
                                else {
                                    await ctx.reply(caption, { parse_mode: 'Markdown' });
                                }
                            }
                        }
                        await ctx.reply('Use /start to go to the main menu.', (0, menus_1.getMainMenu)(ctx.session?.language));
                        return;
                    }
                }
            }
            // ── Deep Link: Agency Profile ─────────────────────────────────────────
            // Format: agency_<agency_id>
            if (payload.startsWith('agency_')) {
                const agencyId = payload.substring(7);
                const agency = await (0, db_1.getAgencyById)(agencyId);
                if (!agency) {
                    await ctx.reply(`❌ Agency not found. Use /start to explore properties.`);
                    return;
                }
                const verified = agency.verified_status ? ' ✔️ *Verified*' : '';
                const agencyMsg = `🏢 *${agency.agency_name}*${verified}\n\n` +
                    `📞 *Phone:* ${agency.phone_number}\n` +
                    `📝 ${agency.description}\n\n` +
                    `*Listings by this agency:*`;
                await ctx.reply(agencyMsg, { parse_mode: 'Markdown' });
                const properties = await (0, db_1.getAgencyProperties)(agencyId);
                if (properties.length === 0) {
                    await ctx.reply('No listings from this agency yet.');
                }
                else {
                    for (const p of properties.slice(0, 5)) {
                        const caption = (0, formatting_1.formatListing)(p);
                        if (p.images?.length > 0) {
                            await ctx.replyWithPhoto(p.images[0], { caption, parse_mode: 'Markdown' });
                        }
                        else {
                            await ctx.reply(caption, { parse_mode: 'Markdown' });
                        }
                    }
                }
                await ctx.reply('Use /start for the main menu.', (0, menus_1.getMainMenu)(ctx.session?.language));
                return;
            }
            // ── Deep Link: Single Listing ─────────────────────────────────────────
            // Format: listing_<uuid>
            if (payload.startsWith('listing_')) {
                const listingId = payload.substring(8);
                const { getPropertyById } = require('../services/db');
                const property = await getPropertyById(listingId);
                if (!property) {
                    await ctx.reply(`❌ Listing not found.`);
                }
                else {
                    const caption = (0, formatting_1.formatListing)(property);
                    const primaryChannel = env_1.env.CHANNEL_IDS.split(',')[0].trim().replace('@', '');
                    const viewUrl = property.channel_message_id
                        ? `https://t.me/${primaryChannel}/${property.channel_message_id}`
                        : null;
                    if (property.images?.length > 0) {
                        await ctx.replyWithPhoto(property.images[0], {
                            caption, parse_mode: 'Markdown',
                            ...(viewUrl ? { reply_markup: { inline_keyboard: [[{ text: '📢 View on Channel', url: viewUrl }]] } } : {}),
                        });
                    }
                    else {
                        await ctx.reply(caption, { parse_mode: 'Markdown' });
                    }
                }
                await ctx.reply('Use /start for the main menu.', (0, menus_1.getMainMenu)());
                return;
            }
            // ── Default: Show Main Menu ───────────────────────────────────────────
            const lang = ctx.session?.language || 'en';
            const t = i18n_1.i18n.get(lang);
            const name = ctx.from?.first_name || 'there';
            let welcomeMsg = t.welcome.replace('*Gojo Homes*', `*Gojo Homes*, ${name}`);
            // Add a tip about languages
            welcomeMsg += `\n\n_(Tip: Send /language to switch to Amharic / አማርኛ)_`;
            await ctx.reply(welcomeMsg, { parse_mode: 'Markdown', ...(0, menus_1.getMainMenu)(lang) });
        }
        catch (error) {
            logger_1.logger.error('Error in /start:', error.message);
            await ctx.reply('Something went wrong. Please try /start again.');
        }
    });
    // ── /search Command ───────────────────────────────────────────────────────
    bot.command('search', async (ctx) => {
        await ctx.scene.enter('SEARCH_PROPERTY_SCENE');
    });
    // ── /post Command ─────────────────────────────────────────────────────────
    bot.command('post', async (ctx) => {
        await ctx.scene.enter('POST_PROPERTY_SCENE');
    });
    // ── /latest Command ───────────────────────────────────────────────────────
    bot.command('latest', async (ctx) => {
        await ctx.reply('🆕 Fetching the latest listings...');
        const listings = await (0, db_2.getLatestListings)(6);
        if (listings.length === 0) {
            await ctx.reply('No listings yet. Be the first to post!', (0, menus_1.getMainMenu)());
            return;
        }
        for (const p of listings) {
            const caption = (0, formatting_1.formatListing)(p);
            const primaryChannel = env_1.env.CHANNEL_IDS.split(',')[0].trim().replace('@', '');
            const viewUrl = p.channel_message_id
                ? `https://t.me/${primaryChannel}/${p.channel_message_id}`
                : null;
            if (p.images?.length > 0) {
                await ctx.replyWithPhoto(p.images[0], {
                    caption, parse_mode: 'Markdown',
                    ...(viewUrl ? { reply_markup: { inline_keyboard: [[{ text: '👀 View Full Listing', url: viewUrl }]] } } : {}),
                });
            }
            else {
                await ctx.reply(caption, { parse_mode: 'Markdown' });
            }
        }
        await ctx.reply('Use /start to go to the main menu.', (0, menus_1.getMainMenu)(ctx.session?.language));
    });
};
exports.setupStartCommand = setupStartCommand;
