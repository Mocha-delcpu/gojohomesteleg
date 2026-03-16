import { Scenes, Markup } from 'telegraf';
import { MyContext } from '../utils/types';
import { getCancelMenu } from '../utils/menus';
import { searchProperties, getDestinationChannel } from '../services/db';
import { formatListing, buildSearchLink } from '../utils/formatting';
import { logger } from '../utils/logger';
import { i18n } from '../i18n';
import { ETHIOPIA_LOCATIONS } from '../data/locations';

// ── Location keyboard helpers ────────────────────────────────────────────────
const getRegionsKeyboard = () => {
  const regions = Object.keys(ETHIOPIA_LOCATIONS);
  const keyboard: string[][] = [];
  for (let i = 0; i < regions.length; i += 2) keyboard.push(regions.slice(i, i + 2));
  return keyboard;
};

const getZonesKeyboard = (region: string) => {
  const zones = Object.keys(ETHIOPIA_LOCATIONS[region] || {});
  const keyboard: string[][] = [];
  for (let i = 0; i < zones.length; i += 2) keyboard.push(zones.slice(i, i + 2));
  return keyboard;
};

const getNeighborhoodsKeyboard = (region: string, zone: string) => {
  const neighborhoods = ETHIOPIA_LOCATIONS[region]?.[zone] || [];
  const keyboard: string[][] = [];
  for (let i = 0; i < neighborhoods.length; i += 2) keyboard.push(neighborhoods.slice(i, i + 2));
  return keyboard;
};

export const searchPropertyWizard = new Scenes.WizardScene<MyContext>(
  'SEARCH_PROPERTY_SCENE',

  // ── Step 1: Ask Rent or Sale ──────────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    ctx.wizard.state = {};
    await ctx.reply(t.listingTypePrompt, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[t.rent, t.sale], ['🌐 Any (Both)'], [t.cancelBtn]],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 2: Save Listing Type → Ask Region ────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    if (ctx.message.text === t.rent) ctx.wizard.state.listing_type = 'rent';
    else if (ctx.message.text === t.sale) ctx.wizard.state.listing_type = 'sale';
    else ctx.wizard.state.listing_type = 'any' as any;

    await ctx.reply(t.selectRegion, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...getRegionsKeyboard(), ['🔍 Skip (Search All)'], [t.cancelBtn]],
        resize_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 3: Save Region → Ask Zone/City ──────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    if (ctx.message.text === '🔍 Skip (Search All)') {
      ctx.wizard.state.location = '';
      ctx.wizard.selectStep(6);
      await ctx.reply(t.searchStep2, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
      return;
    }

    const region = ctx.message.text;
    if (!ETHIOPIA_LOCATIONS[region]) {
      await ctx.reply('Please select a valid region from the keyboard.'); return;
    }
    ctx.wizard.state.selectedRegion = region;

    const zones = getZonesKeyboard(region);
    if (zones.length === 0) {
      ctx.wizard.state.location = region;
      ctx.wizard.selectStep(6);
      await ctx.reply(t.searchStep2, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
      return;
    }

    await ctx.reply(t.selectZone, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...zones, ['⬅️ Search whole ' + region], [t.cancelBtn]],
        resize_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 4: Save Zone → Ask Neighborhood ─────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const region = ctx.wizard.state.selectedRegion!;

    if (ctx.message.text.startsWith('⬅️ Search whole ')) {
      ctx.wizard.state.location = region;
      ctx.wizard.selectStep(6);
      await ctx.reply(`${t.selectedLocation} *${region}*\n\n${t.searchStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
      return;
    }

    const zone = ctx.message.text;
    if (!ETHIOPIA_LOCATIONS[region]?.[zone]) {
      ctx.wizard.state.location = `${region} - ${zone}`;
      ctx.wizard.selectStep(6);
      await ctx.reply(`${t.selectedLocation} *${ctx.wizard.state.location}*\n\n${t.searchStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
      return;
    }

    ctx.wizard.state.selectedZone = zone;
    const neighborhoods = getNeighborhoodsKeyboard(region, zone);

    if (neighborhoods.length === 0) {
      ctx.wizard.state.location = `${region} - ${zone}`;
      ctx.wizard.selectStep(6);
      await ctx.reply(`${t.selectedLocation} *${ctx.wizard.state.location}*\n\n${t.searchStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
      return;
    }

    await ctx.reply(t.selectNeighborhood, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...neighborhoods, ['⬅️ All of ' + zone], [t.cancelBtn]],
        resize_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 5: Save Neighborhood → Ask Property Type ─────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const region = ctx.wizard.state.selectedRegion!;
    const zone = ctx.wizard.state.selectedZone!;

    ctx.wizard.state.location = ctx.message.text.startsWith('⬅️ All of ')
      ? `${region} - ${zone}`
      : `${region} - ${zone} - ${ctx.message.text}`;

    await ctx.reply(`${t.selectedLocation} *${ctx.wizard.state.location}*\n\n${t.searchStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeKeyboard(t.cancelBtn) });
    return ctx.wizard.next();
  },

  // ── Step 6: Save Property Type → Ask Min Price ────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    ctx.wizard.state.property_type = ctx.message.text === 'Any Type' ? 'any' : ctx.message.text;
    await ctx.reply(t.searchStep3, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 7: Save Min Price → Ask Max Price ────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const minPrice = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(minPrice) || minPrice < 0) { await ctx.reply(t.invalidNumber); return; }
    ctx.wizard.state.price = minPrice;
    await ctx.reply(t.searchStep4, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 8: Save Max Price → Search & Return Results ─────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelSearch(ctx);

    const maxPrice = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(maxPrice) || maxPrice <= 0) { await ctx.reply(t.invalidNumber); return; }

    await ctx.reply(t.searchSearching, Markup.removeKeyboard());

    const s = ctx.wizard.state;
    const location = s.location || '';
    const type = s.property_type!;
    const minPrice = s.price!;
    const listingType = (s.listing_type as any) || 'any';

    const results = await searchProperties(location, listingType, type, minPrice, maxPrice);

    if (results.length === 0) {
      await ctx.reply(t.searchNoResults, { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
    } else {
      const locationDisplay = location || 'Ethiopia';
      await ctx.reply(`✅ Found *${results.length} listing(s)* in *${locationDisplay}*:`, { parse_mode: 'Markdown' });

      for (const property of results) {
        const caption = formatListing(property);
        let viewUrl: string | null = null;

        if (property.channel_message_id) {
          const dest = await getDestinationChannel();
          viewUrl = `https://t.me/${dest.replace('@', '')}/${property.channel_message_id}`;
        }

        const buttons = viewUrl
          ? Markup.inlineKeyboard([[{ text: '👀 View Full Listing', url: viewUrl }]])
          : Markup.inlineKeyboard([]);

        if (property.photos && property.photos.length > 0) {
          await ctx.replyWithPhoto(property.photos[0], { caption, parse_mode: 'Markdown', ...buttons });
        } else {
          await ctx.reply(caption, { parse_mode: 'Markdown', ...buttons });
        }
      }
    }

    const searchLink = buildSearchLink(location, listingType, minPrice, maxPrice, type);
    const shareText = encodeURIComponent(`🔍 Properties in ${location || 'Ethiopia'} on Gojo Homes!\n${searchLink}`);
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(searchLink)}&text=${shareText}`;

    await ctx.reply(`🔗 *Share this search* with friends:`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '📤 Share This Search', url: telegramShareUrl }]] },
    });

    logger.info(`Search: location="${location}", type=${type}, listingType=${listingType}, price=${minPrice}-${maxPrice}, results=${results.length}`);
    return ctx.scene.leave();
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const getPropertyTypeKeyboard = (cancelBtn: string) => Markup.keyboard([
  ['Apartment', 'Villa'],
  ['Studio', 'Commercial'],
  ['Land', 'Any Type'],
  [cancelBtn]
]).resize().oneTime();

const cancelSearch = async (ctx: MyContext) => {
  const t = i18n.get(ctx.session?.language);
  await ctx.reply('❌ Search cancelled. Use /start to go back to the main menu.', Markup.removeKeyboard());
  return ctx.scene.leave();
};
