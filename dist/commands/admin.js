"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdminCommands = void 0;
const env_1 = require("../config/env");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logger_1 = require("../utils/logger");
const db_1 = require("../services/db");
const channel_1 = require("../services/channel");
const formatting_1 = require("../utils/formatting");
/** Check if a user is an admin */
const isAdmin = (userId) => env_1.env.ADMIN_IDS.includes(userId);
const setupAdminCommands = (bot) => {
    // ── /list_properties ─────────────────────────────────────────────────────
    bot.command('list_properties', async (ctx) => {
        if (!isAdmin(ctx.from.id))
            return ctx.reply('⛔ Unauthorized.');
        const listings = await (0, db_1.listAllProperties)(20);
        if (listings.length === 0)
            return ctx.reply('No listings found.');
        let msg = '📋 *Recent Listings:*\n\n';
        listings.forEach((p, i) => {
            msg += `${i + 1}. \`${(0, formatting_1.shortId)(p.id)}\` — ${p.property_type} in ${p.location} @ ${p.price.toLocaleString()} ETB\n`;
            msg += `   ID: \`${p.id}\`\n\n`;
        });
        await ctx.reply(msg, { parse_mode: 'Markdown' });
    });
    // ── /delete_listing <id> ──────────────────────────────────────────────────
    bot.command('delete_listing', async (ctx) => {
        if (!isAdmin(ctx.from.id))
            return ctx.reply('⛔ Unauthorized.');
        const args = ctx.message.text.split(' ');
        if (args.length < 2)
            return ctx.reply('Usage: /delete_listing <listing_uuid>');
        const id = args[1].trim();
        const property = await (0, db_1.getPropertyById)(id);
        if (!property)
            return ctx.reply(`❌ Listing \`${id}\` not found.`, { parse_mode: 'Markdown' });
        // Delete from Telegram channel if it was posted
        if (property.channel_message_id) {
            await (0, channel_1.deleteFromChannel)(bot, property.channel_message_id);
        }
        const success = await (0, db_1.deleteProperty)(id);
        if (success) {
            await ctx.reply(`✅ Listing \`${(0, formatting_1.shortId)(id)}\` deleted.`, { parse_mode: 'Markdown' });
            logger_1.logger.info(`Admin ${ctx.from.id} deleted listing ${id}`);
        }
        else {
            await ctx.reply('❌ Failed to delete listing.');
        }
    });
    // ── /edit_listing <id> ────────────────────────────────────────────────────
    bot.command('edit_listing', async (ctx) => {
        if (!isAdmin(ctx.from.id))
            return ctx.reply('⛔ Unauthorized.');
        await ctx.reply('✏️ To edit a listing, delete it with `/delete_listing <id>` and re-post it through the bot.', { parse_mode: 'Markdown' });
    });
    // ── /verify_agency <agency_id> ────────────────────────────────────────────
    bot.command('verify_agency', async (ctx) => {
        if (!isAdmin(ctx.from.id))
            return ctx.reply('⛔ Unauthorized.');
        const args = ctx.message.text.split(' ');
        if (args.length < 2)
            return ctx.reply('Usage: /verify_agency <agency_id>\nExample: /verify_agency sunrise');
        const agencyId = args[1].trim().toLowerCase();
        const success = await (0, db_1.verifyAgency)(agencyId);
        if (success) {
            await ctx.reply(`✅ Agency \`${agencyId}\` has been verified! ✔️`, { parse_mode: 'Markdown' });
            logger_1.logger.info(`Admin ${ctx.from.id} verified agency: ${agencyId}`);
        }
        else {
            await ctx.reply(`❌ Could not verify agency \`${agencyId}\`. Check if the ID is correct.`, { parse_mode: 'Markdown' });
        }
    });
    // ── /setchannel <@channelname> ──────────────────────────────────────────────
    bot.command('setchannel', async (ctx) => {
        if (!isAdmin(ctx.from.id))
            return ctx.reply('⛔ Unauthorized.');
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            const current = await (0, db_1.getDestinationChannel)();
            return ctx.reply(`Usage: /setchannel <@channelname>\nCurrent channel: ${current}`);
        }
        const channelId = args[1].trim();
        if (!channelId.startsWith('@') && !channelId.startsWith('-100')) {
            return ctx.reply('❌ Channel must start with @ or -100 (for private channels)', { parse_mode: 'Markdown' });
        }
        const success = await (0, db_1.setDestinationChannel)(channelId);
        if (success) {
            await ctx.reply(`✅ Destination channel updated to \`${channelId}\`! ✔️`, { parse_mode: 'Markdown' });
            logger_1.logger.info(`Admin ${ctx.from.id} changed destination channel to: ${channelId}`);
        }
        else {
            await ctx.reply(`❌ Could not update destination channel. Ensure the database 'settings' table exists.`, { parse_mode: 'Markdown' });
        }
    });
};
exports.setupAdminCommands = setupAdminCommands;
