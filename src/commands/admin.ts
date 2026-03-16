import { Telegraf } from 'telegraf';
import { MyContext } from '../utils/types';
import { env } from '../config/env';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { logger } from '../utils/logger';
import {
  deleteProperty,
  getPropertyById,
  listAllProperties,
  verifyAgency,
} from '../services/db';
import { deleteFromChannel } from '../services/channel';
import { shortId } from '../utils/formatting';

/** Check if a user is an admin */
const isAdmin = (userId: number): boolean => env.ADMIN_IDS.includes(userId);

export const setupAdminCommands = (bot: Telegraf<MyContext>) => {

  // ── /list_properties ─────────────────────────────────────────────────────
  bot.command('list_properties', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Unauthorized.');

    const listings = await listAllProperties(20);
    if (listings.length === 0) return ctx.reply('No listings found.');

    let msg = '📋 *Recent Listings:*\n\n';
    listings.forEach((p, i) => {
      msg += `${i + 1}. \`${shortId(p.id!)}\` — ${p.property_type} in ${p.location} @ ${p.price.toLocaleString()} ETB\n`;
      msg += `   ID: \`${p.id}\`\n\n`;
    });

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  });

  // ── /delete_listing <id> ──────────────────────────────────────────────────
  bot.command('delete_listing', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Unauthorized.');

    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /delete_listing <listing_uuid>');

    const id = args[1].trim();
    const property = await getPropertyById(id);

    if (!property) return ctx.reply(`❌ Listing \`${id}\` not found.`, { parse_mode: 'Markdown' });

    // Delete from Telegram channel if it was posted
    if (property.channel_message_id) {
      await deleteFromChannel(bot as any, property.channel_message_id);
    }

    const success = await deleteProperty(id);
    if (success) {
      await ctx.reply(`✅ Listing \`${shortId(id)}\` deleted.`, { parse_mode: 'Markdown' });
      logger.info(`Admin ${ctx.from.id} deleted listing ${id}`);
    } else {
      await ctx.reply('❌ Failed to delete listing.');
    }
  });

  // ── /edit_listing <id> ────────────────────────────────────────────────────
  bot.command('edit_listing', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Unauthorized.');
    await ctx.reply(
      '✏️ To edit a listing, delete it with `/delete_listing <id>` and re-post it through the bot.',
      { parse_mode: 'Markdown' }
    );
  });

  // ── /verify_agency <agency_id> ────────────────────────────────────────────
  bot.command('verify_agency', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Unauthorized.');

    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('Usage: /verify_agency <agency_id>\nExample: /verify_agency sunrise');

    const agencyId = args[1].trim().toLowerCase();
    const success = await verifyAgency(agencyId);

    if (success) {
      await ctx.reply(`✅ Agency \`${agencyId}\` has been verified! ✔️`, { parse_mode: 'Markdown' });
      logger.info(`Admin ${ctx.from.id} verified agency: ${agencyId}`);
    } else {
      await ctx.reply(`❌ Could not verify agency \`${agencyId}\`. Check if the ID is correct.`, { parse_mode: 'Markdown' });
    }
  });
};
