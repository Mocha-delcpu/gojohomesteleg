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

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

export const postPropertyWizard = new Scenes.WizardScene<MyContext>(
  'POST_PROPERTY_SCENE',

  // ── Step 1: Ask Location ─────────────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    await ctx.reply(t.postStep1, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    ctx.wizard.state = { photos: [] };
    return ctx.wizard.next();
  },

  // ── Step 2: Save Location → Ask Type ────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
    if (!ctx.message.text.trim()) {
      await ctx.reply(t.invalidLocation); return;
    }

    ctx.wizard.state.location = ctx.message.text.trim();
    await ctx.reply(t.postStep2, { parse_mode: 'Markdown', ...getPropertyTypeMenu() });
    return ctx.wizard.next();
  },

  // ── Step 3: Save Type → Ask Price ────────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const validTypes = ['Apartment', 'Villa', 'Studio', 'Commercial', 'Land'];
    if (!validTypes.includes(ctx.message.text)) {
      await ctx.reply('Please choose a valid property type.'); return;
    }

    ctx.wizard.state.propertyType = ctx.message.text;
    await ctx.reply(t.postStep3, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 4: Save Price → Ask Bedrooms (or skip for Land) ────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const price = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(price) || price <= 0) {
      await ctx.reply(t.invalidNumber); return;
    }
    ctx.wizard.state.price = price;

    if (ctx.wizard.state.propertyType === 'Land') {
      ctx.wizard.state.bedrooms = 0;
      await ctx.reply(t.postStep5, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
      ctx.wizard.selectStep(5); // skip bedrooms
      return;
    }

    await ctx.reply(t.postStep4, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 5: Save Bedrooms → Ask Description ──────────────────────────────
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

  // ── Step 6: Save Description → Ask Photo ────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);
    if (ctx.message.text.trim().length < 10) {
      await ctx.reply('Please write a more detailed description (at least 10 characters).'); return;
    }

    ctx.wizard.state.description = ctx.message.text.trim();
    await ctx.reply(t.postPhoto, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 7: Save Photo → Ask Phone ───────────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (ctx.message && 'text' in ctx.message && (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')) return cancelPost(ctx);

    if (!ctx.message || !('photo' in ctx.message)) {
      await ctx.reply('Please upload a *photo* of the property.', { parse_mode: 'Markdown' }); return;
    }

    // Get the highest-quality version of the photo
    const photos = ctx.message.photo;
    ctx.wizard.state.photos = [photos[photos.length - 1].file_id];

    await ctx.reply(t.postContact, { parse_mode: 'Markdown', ...getCancelMenu(ctx.session?.language) });
    return ctx.wizard.next();
  },

  // ── Step 8: Save Phone → Show Summary ───────────────────────────────────
  async (ctx) => {
    const t = i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message)) return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel') return cancelPost(ctx);

    const phone = ctx.message.text.trim();
    if (!/^[0-9+\s\-()]{7,15}$/.test(phone)) {
      await ctx.reply('Please enter a valid phone number.'); return;
    }
    ctx.wizard.state.contactPhone = phone;

    const s = ctx.wizard.state;
    const bedroomLine = s.bedrooms! > 0 ? `\n🛏 *${t.bedrooms}:* ${s.bedrooms}` : '';
    const summary =
      `${t.postConfirm}\n\n` +
      `📍 *${t.location}:* ${s.location}\n` +
      `🏘 *Type:* ${s.propertyType}\n` +
      `💰 *${t.price}:* ${(s.price!).toLocaleString()} ETB` +
      `${bedroomLine}\n` +
      `📝 *${t.description}:* ${s.description}\n` +
      `📞 *${t.contact}:* ${s.contactPhone}`;

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

  // ── Step 9: Confirm → Save & Publish ────────────────────────────────────
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
      property_type: s.propertyType!,
      location: s.location!,
      price: s.price!,
      bedrooms: s.bedrooms!,
      description: s.description!,
      contact_phone: s.contactPhone!,
      images: s.photos || [],
      agency_id: null,
      channel_message_id: null,
    };

    // 1. Save to Supabase
    const saved = await insertProperty(propertyData);
    if (!saved) {
      await ctx.reply('❌ Failed to save your listing to the database. Please try again.');
      return ctx.scene.leave();
    }

    // 2. Publish to channel
    const channelMsgId = await publishToChannel(_bot, saved);
    if (channelMsgId) {
      await updateChannelMessageId(saved.id!, channelMsgId);
    }

    // 3. Build viral share link for landlord
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
