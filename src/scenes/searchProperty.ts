import { Scenes, Markup } from 'telegraf';
import { MyContext } from '../utils/types';
import { getPropertyTypeMenu, getCancelMenu } from '../utils/menus';
import { searchProperties, getDestinationChannel } from '../services/db';
import { formatListing, buildSearchLink } from '../utils/formatting';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { i18n } from '../i18n';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Studio', 'Commercial', 'Land', 'Any Type'];

export const searchPropertyWizard = new Scenes.WizardScene<MyContext>(
  'SEARCH_PROPERTY_SCENE',

  // ── Step 1: Ask Location ─────────────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    await ctx.reply(t.searchStep1, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    ctx.wizard.state = {};
    return ctx.wizard.next();
  },

  // ── Step 2: Save Location → Ask Type ────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);
    if (!ctx.message.text.trim()) { await ctx.reply(t.invalidLocation); return; }

    ctx.wizard.state.location = ctx.message.text.trim();

    const propertyKeyboard = Markup.keyboard([
      ['Apartment', 'Villa'],
      ['Studio', 'Commercial'],
      ['Land', 'Any Type'],
      [t.cancelBtn]
    ]).resize().oneTime();

    await ctx.reply(t.searchStep2, { parse_mode: 'Markdown', ...propertyKeyboard });
    return ctx.wizard.next();
  },

  // ── Step 3: Save Type → Ask Min Price ───────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    ctx.wizard.state.propertyType = ctx.message.text === 'Any Type' ? 'any' : ctx.message.text;

    await ctx.reply(t.searchStep3, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 4: Save Min Price → Ask Max Price ──────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const minPrice = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(minPrice) || minPrice < 0) {
      await ctx.reply(t.invalidNumber); return;
    }

    ctx.wizard.state.minPrice = minPrice;

    await ctx.reply(t.searchStep4, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 5: Save Max Price → Query → Return Results ─────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const maxPrice = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(maxPrice) || maxPrice <= 0) {
      await ctx.reply(t.invalidNumber); return;
    }

    await ctx.reply(t.searchSearching, Markup.removeKeyboard());

    const s = ctx.wizard.state;
    const location = s.location!;
    const type = s.propertyType!;

    const minPrice = ctx.wizard.state.minPrice!;

    // Search Supabase
    const results = await searchProperties(location, type, minPrice, maxPrice);

    if (results.length === 0) {
      await ctx.reply(t.searchNoResults, { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
    } else {
      await ctx.reply(`✅ Found *${results.length} listing(s)* matching your search:`, { parse_mode: 'Markdown' });

      for (const property of results) {
        const caption = formatListing(property);
        let viewUrl = null;
        
        // Use the configured channel for deep linking if channel_message_id exists
        if (property.channel_message_id) {
            const dest = await getDestinationChannel();
            const primaryChannel = dest.replace('@', '');
            viewUrl = `https://t.me/${primaryChannel}/${property.channel_message_id}`;
        }

        const buttons = viewUrl
          ? Markup.inlineKeyboard([[{ text: '👀 View Full Listing', url: viewUrl }]])
          : Markup.inlineKeyboard([]);

        if (property.images && property.images.length > 0) {
          await ctx.replyWithPhoto(property.images[0], {
            caption,
            parse_mode: 'Markdown',
            ...buttons,
          });
        } else {
          await ctx.reply(caption, { parse_mode: 'Markdown', ...buttons });
        }
      }
    }

    // Generate shareable search link
    const searchLink = buildSearchLink(location, minPrice, maxPrice, type);
    const shareText = encodeURIComponent(
      `🔍 Check out properties in ${location} on Gojo Homes!\n${searchLink}`
    );
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(searchLink)}&text=${shareText}`;

    await ctx.reply(
      `🔗 *Share this search* with friends or in Telegram groups:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📤 Share This Search', url: telegramShareUrl }],
          ],
        },
      }
    );

    logger.info(`Search completed: location=${location}, type=${type}, price=${minPrice}-${maxPrice}, results=${results.length}`);
    return ctx.scene.leave();
  }
);

const cancelSearch = async (ctx: MyContext) => {
  const t = i18n.get(ctx.session?.language);
  await ctx.reply('❌ Search cancelled. Use /start to go back to the main menu.', Markup.removeKeyboard());
  return ctx.scene.leave();
};
