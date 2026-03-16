import { Scenes, Markup, Telegraf } from 'telegraf';
import { MyContext } from '../utils/types';
import { getPropertyTypeMenu, getCancelMenu } from '../utils/menus';
import { insertProperty, updateChannelMessageId } from '../services/db';
import { publishToChannel } from '../services/channel';
import { shortId, buildListingLink } from '../utils/formatting';
import { logger } from '../utils/logger';
import { i18n } from '../i18n';

// The bot instance is passed in so the scene can call publishToChannel
let _bot: Telegraf;
export const setBotInstance = (bot: Telegraf) => { _bot = bot; };

import { ETHIOPIA_LOCATIONS } from '../data/locations';

const getRegionsKeyboard = () => {
  const regions = Object.keys(ETHIOPIA_LOCATIONS);
  // Break into rows of 2 for better UI
  const keyboard = [];
  for (let i = 0; i < regions.length; i += 2) {
    keyboard.push(regions.slice(i, i + 2));
  }
  return keyboard;
};

const getZonesKeyboard = (region: string) => {
  const zones = Object.keys(ETHIOPIA_LOCATIONS[region] || {});
  const keyboard = [];
  for (let i = 0; i < zones.length; i += 2) {
    keyboard.push(zones.slice(i, i + 2));
  }
  return keyboard;
};

const getNeighborhoodsKeyboard = (region: string, zone: string) => {
  const neighborhoods = ETHIOPIA_LOCATIONS[region]?.[zone] || [];
  const keyboard = [];
  for (let i = 0; i < neighborhoods.length; i += 2) {
    keyboard.push(neighborhoods.slice(i, i + 2));
  }
  return keyboard;
};

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

export const postPropertyWizard = new Scenes.WizardScene<MyContext>(
  'POST_PROPERTY_SCENE',

  // ── Step 1: Ask Rent or Sale ─────────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    ctx.wizard.state = {};
    
    await ctx.reply(t.listingTypePrompt, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[t.rent, t.sale], [t.cancelBtn]],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 2: Save Type → Ask Region ───────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
    
    if (ctx.message.text === t.rent) ctx.wizard.state.listing_type = 'rent';
    else if (ctx.message.text === t.sale) ctx.wizard.state.listing_type = 'sale';
    else {
      await ctx.reply(t.listingTypePrompt); return;
    }

    await ctx.reply(t.selectRegion, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...getRegionsKeyboard(), [t.cancelBtn]],
        resize_keyboard: true
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 3: Save Region → Ask Zone/City ──────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const region = ctx.message.text;
    if (!ETHIOPIA_LOCATIONS[region]) {
      await ctx.reply('Please select a valid region from the keyboard.'); return;
    }

    ctx.wizard.state.selectedRegion = region;
    
    // Check if region has zones
    const zones = getZonesKeyboard(region);
    if (zones.length === 0) {
      // Edge case: Region has no detailed zones. Set location as Region and skip to property type
      ctx.wizard.state.location = region;
      await ctx.reply(t.postStep2, { parse_mode: 'Markdown', ...getPropertyTypeMenu() });
      ctx.wizard.selectStep(5); // Goto Property Type step
      return;
    }

    await ctx.reply(t.selectZone, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...zones, [t.cancelBtn]],
        resize_keyboard: true
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 4: Save Zone → Ask Neighborhood ─────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const zone = ctx.message.text;
    const region = ctx.wizard.state.selectedRegion!;
    
    if (!ETHIOPIA_LOCATIONS[region][zone]) {
      // If user types a custom zone that isn't in our list, we accept it and stop drilling down
      ctx.wizard.state.location = `${region} - ${zone}`;
      await ctx.reply(`${t.selectedLocation} ${ctx.wizard.state.location}\n\n${t.postStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeMenu() });
      ctx.wizard.selectStep(5); // Goto Property Type step
      return;
    }

    ctx.wizard.state.selectedZone = zone;
    
    const neighborhoods = getNeighborhoodsKeyboard(region, zone);
    if (neighborhoods.length === 0) {
      // No deeper hierarchy, save and move on
      ctx.wizard.state.location = `${region} - ${zone}`;
      await ctx.reply(`${t.selectedLocation} ${ctx.wizard.state.location}\n\n${t.postStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeMenu() });
      ctx.wizard.selectStep(5);
      return;
    }

    await ctx.reply(t.selectNeighborhood, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [...neighborhoods, ['Skip / Any'], [t.cancelBtn]],
        resize_keyboard: true
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 5: Save Neighborhood → Ask Property Type ───────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const hood = ctx.message.text;
    const region = ctx.wizard.state.selectedRegion!;
    const zone = ctx.wizard.state.selectedZone!;

    if (hood === 'Skip / Any') {
      ctx.wizard.state.location = `${region} - ${zone}`;
    } else {
      ctx.wizard.state.location = `${region} - ${zone} - ${hood}`;
    }

    await ctx.reply(`${t.selectedLocation} *${ctx.wizard.state.location}*\n\n${t.postStep2}`, { parse_mode: 'Markdown', ...getPropertyTypeMenu() });
    return ctx.wizard.next();
  },

  // ── Step 6: Save Type → Ask Price ────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const validTypes = ['Apartment', 'Villa', 'Studio', 'Commercial', 'Land'];
    if (!validTypes.includes(ctx.message.text)) {
      await ctx.reply('Please choose a valid property type.'); return;
    }

    ctx.wizard.state.property_type = ctx.message.text;
    await ctx.reply(t.postStep3, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 7: Save Price → Ask Bedrooms (or skip for Land) ────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const price = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(price) || price <= 0) {
      await ctx.reply(t.invalidNumber); return;
    }
    ctx.wizard.state.price = price;

    if (ctx.wizard.state.property_type === 'Land') {
      ctx.wizard.state.bedrooms = 0;
      await ctx.reply(t.postStep5, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
      ctx.wizard.selectStep(8); // skip bedrooms
      return;
    }

    await ctx.reply(t.postStep4, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 8: Save Bedrooms → Ask Description ──────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const beds = parseInt(ctx.message.text, 10);
    if (isNaN(beds) || beds < 0) {
      await ctx.reply(t.invalidNumber); return;
    }
    ctx.wizard.state.bedrooms = beds;

    await ctx.reply(t.postStep5, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 9: Save Description → Ask Photo ────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
    if (ctx.message.text.trim().length < 10) {
      await ctx.reply('Please write a more detailed description (at least 10 characters).'); return;
    }

    ctx.wizard.state.description = ctx.message.text.trim();
    ctx.wizard.state.photos = [];
    
    await ctx.reply('Please upload up to 5 photos of the property. You can select multiple photos at once. Once you have uploaded all your photos, press the *Done ✅* button below.', { 
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [['Done ✅'], [t.cancelBtn]],
        resize_keyboard: true,
      }
    });
    return ctx.wizard.next();
  },

  // ── Step 10: Save Photo → Ask Phone ───────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message) return;

    if ('text' in ctx.message) {
      if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
      if (ctx.message.text === 'Done ✅') {
        if (!ctx.wizard.state.photos || ctx.wizard.state.photos.length === 0) {
           await ctx.reply('Please upload at least one photo before pressing Done!');
           return;
        }
        await ctx.reply(t.postContact, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
        return ctx.wizard.next();
      }
    }

    if ('photo' in ctx.message) {
      if (!ctx.wizard.state.photos) ctx.wizard.state.photos = [];
      if (ctx.wizard.state.photos.length >= 5) {
        await ctx.reply('You can only upload up to 5 photos. Press *Done ✅* to continue.', { parse_mode: 'Markdown' });
        return;
      }
      
      const photos = ctx.message.photo;
      ctx.wizard.state.photos.push(photos[photos.length - 1].file_id);
      
      if (ctx.wizard.state.photos.length === 1 && !ctx.message.media_group_id) {
        await ctx.reply(`Received photo. You can upload up to 4 more, or press *Done ✅* if you are finished.`, { parse_mode: 'Markdown' });
      } else if (ctx.wizard.state.photos.length === 5) {
        await ctx.reply('You have reached the limit of 5 photos. Please press *Done ✅* to continue.', { parse_mode: 'Markdown' });
      }
      return;
    }

    await ctx.reply('Please upload a photo or press *Done ✅*.', { parse_mode: 'Markdown' });
  },

  // ── Step 11: Save Phone → Show Summary ───────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const phone = ctx.message.text.trim();
    if (!/^[0-9+\s\-()]{7,15}$/.test(phone)) {
      await ctx.reply('Please enter a valid phone number.'); return;
    }
    ctx.wizard.state.contact_phone = phone;

    const s = ctx.wizard.state;
    const typeStr = s.listing_type === 'rent' ? t.rent : t.sale;
    const bedroomLine = s.bedrooms! > 0 ? `\n🛏 *${t.bedrooms}:* ${s.bedrooms}` : '';
    const summary =
      `${t.postConfirm}\n\n` +
      `📢 *Type:* ${typeStr}\n` +
      `📍 *${t.location}:* ${s.location}\n` +
      `🏘 *Property:* ${s.property_type}\n` +
      `💰 *${t.price}:* ${(s.price!).toLocaleString()} ETB` +
      `${bedroomLine}\n` +
      `📝 *${t.description}:* ${s.description}\n` +
      `📞 *${t.contact}:* ${s.contact_phone}`;

    await ctx.reply(summary, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[t.confirmBtn], [t.cancelBtn]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return ctx.wizard.next();
  },

  // ── Step 12: Confirm → Save & Publish ────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
    if (ctx.message.text !== t.confirmBtn) {
      await ctx.reply(`Please press *${t.confirmBtn}* or *${t.cancelBtn}*.`, { parse_mode: 'Markdown' }); return;
    }

    await ctx.reply('⏳ Publishing your listing...', Markup.removeKeyboard());

    const s = ctx.wizard.state;
    const propertyData = {
      listing_type: s.listing_type!,
      property_type: s.property_type!,
      location: s.location!,
      price: s.price!,
      bedrooms: s.bedrooms!,
      description: s.description!,
      contact_phone: s.contact_phone!,
      photos: s.photos || [],
      user_id: ctx.from?.id || 0,
      user_name: ctx.from?.first_name || 'Agent',
    };

    const saved = await insertProperty(propertyData);
    if (!saved) {
      await ctx.reply('❌ Failed to save your listing to the database. Please try again.');
      return ctx.scene.leave();
    }

    const channelMsgId = await publishToChannel(_bot, saved);
    if (channelMsgId) {
      await updateChannelMessageId(saved.id!, channelMsgId);
    }

    const listingUrl = buildListingLink(saved.id!);
    const shareText = encodeURIComponent(
      `🏠 New listing on Gojo Homes!\n📍 ${saved.location}\n💰 ${saved.price.toLocaleString()} ETB\n\nCheck it out: ${listingUrl}`
    );
    const shareLink = `https://t.me/share/url?url=${encodeURIComponent(listingUrl)}&text=${shareText}`;

    const listingId = shortId(saved.id!);
    await ctx.reply(
      `${t.postSuccess}\n\n` +
      `🆔 *Listing ID:* \`${listingId}\`\n\n` +
      `Share your listing in Telegram groups to find renters faster 👇`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '📢 Share Listing in Groups', url: shareLink }]],
        },
      }
    );

    logger.info(`New listing saved: id=${saved.id}, location=${saved.location}`);
    return ctx.scene.leave();
  }
);

// ─── Helper ───────────────────────────────────────────────────────────────────

const cancelPost = async (ctx: MyContext) => {
  const t = i18n.get(ctx.session?.language);
  await ctx.reply('❌ Listing cancelled. Use /start to go back to the main menu.', Markup.removeKeyboard());
  return ctx.scene.leave();
};
