"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postPropertyWizard = exports.setBotInstance = void 0;
const telegraf_1 = require("telegraf");
const menus_1 = require("../utils/menus");
const db_1 = require("../services/db");
const channel_1 = require("../services/channel");
const formatting_1 = require("../utils/formatting");
const logger_1 = require("../utils/logger");
const i18n_1 = require("../i18n");
// The bot instance is passed in so the scene can call publishToChannel
let _bot;
const setBotInstance = (bot) => { _bot = bot; };
exports.setBotInstance = setBotInstance;
// ─── Wizard Steps ─────────────────────────────────────────────────────────────
exports.postPropertyWizard = new telegraf_1.Scenes.WizardScene('POST_PROPERTY_SCENE', 
// ── Step 1: Ask Location ─────────────────────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    await ctx.reply(t.postStep1, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
    ctx.wizard.state = { photos: [] };
    return ctx.wizard.next();
}, 
// ── Step 2: Save Location → Ask Type ────────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    if (!ctx.message.text.trim()) {
        await ctx.reply(t.invalidLocation);
        return;
    }
    ctx.wizard.state.location = ctx.message.text.trim();
    await ctx.reply(t.postStep2, { parse_mode: 'Markdown', ...(0, menus_1.getPropertyTypeMenu)() });
    return ctx.wizard.next();
}, 
// ── Step 3: Save Type → Ask Price ────────────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    const validTypes = ['Apartment', 'Villa', 'Studio', 'Commercial', 'Land'];
    if (!validTypes.includes(ctx.message.text)) {
        await ctx.reply('Please choose a valid property type.');
        return;
    }
    ctx.wizard.state.propertyType = ctx.message.text;
    await ctx.reply(t.postStep3, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
    return ctx.wizard.next();
}, 
// ── Step 4: Save Price → Ask Bedrooms (or skip for Land) ────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    const price = parseInt(ctx.message.text.replace(/[^\d]/g, ''), 10);
    if (isNaN(price) || price <= 0) {
        await ctx.reply(t.invalidNumber);
        return;
    }
    ctx.wizard.state.price = price;
    if (ctx.wizard.state.propertyType === 'Land') {
        ctx.wizard.state.bedrooms = 0;
        await ctx.reply(t.postStep5, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
        ctx.wizard.selectStep(5); // skip bedrooms
        return;
    }
    await ctx.reply(t.postStep4, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
    return ctx.wizard.next();
}, 
// ── Step 5: Save Bedrooms → Ask Description ──────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    const beds = parseInt(ctx.message.text, 10);
    if (isNaN(beds) || beds < 0) {
        await ctx.reply(t.invalidNumber);
        return;
    }
    ctx.wizard.state.bedrooms = beds;
    await ctx.reply(t.postStep5, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
    return ctx.wizard.next();
}, 
// ── Step 6: Save Description → Ask Photo ────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    if (ctx.message.text.trim().length < 10) {
        await ctx.reply('Please write a more detailed description (at least 10 characters).');
        return;
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
// ── Step 7: Save Photo → Ask Phone ───────────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message)
        return;
    if ('text' in ctx.message) {
        if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
            return cancelPost(ctx);
        if (ctx.message.text === 'Done ✅') {
            if (!ctx.wizard.state.photos || ctx.wizard.state.photos.length === 0) {
                await ctx.reply('Please upload at least one photo before pressing Done!');
                return;
            }
            await ctx.reply(t.postContact, { parse_mode: 'Markdown', ...(0, menus_1.getCancelMenu)(ctx.session?.language) });
            return ctx.wizard.next();
        }
    }
    if ('photo' in ctx.message) {
        if (!ctx.wizard.state.photos)
            ctx.wizard.state.photos = [];
        if (ctx.wizard.state.photos.length >= 5) {
            await ctx.reply('You can only upload up to 5 photos. Press *Done ✅* to continue.', { parse_mode: 'Markdown' });
            return;
        }
        const photos = ctx.message.photo;
        ctx.wizard.state.photos.push(photos[photos.length - 1].file_id);
        // We only reply on the first photo to avoid spam when they upload an album
        if (ctx.wizard.state.photos.length === 1 && !ctx.message.media_group_id) {
            await ctx.reply(`Received photo. You can upload up to 4 more, or press *Done ✅* if you are finished.`, { parse_mode: 'Markdown' });
        }
        else if (ctx.wizard.state.photos.length === 5) {
            await ctx.reply('You have reached the limit of 5 photos. Please press *Done ✅* to continue.', { parse_mode: 'Markdown' });
        }
        return; // Wait for them to tap Done
    }
    await ctx.reply('Please upload a photo or press *Done ✅*.', { parse_mode: 'Markdown' });
}, 
// ── Step 8: Save Phone → Show Summary ───────────────────────────────────
async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    const phone = ctx.message.text.trim();
    if (!/^[0-9+\s\-()]{7,15}$/.test(phone)) {
        await ctx.reply('Please enter a valid phone number.');
        return;
    }
    ctx.wizard.state.contactPhone = phone;
    const s = ctx.wizard.state;
    const bedroomLine = s.bedrooms > 0 ? `\n🛏 *${t.bedrooms}:* ${s.bedrooms}` : '';
    const summary = `${t.postConfirm}\n\n` +
        `📍 *${t.location}:* ${s.location}\n` +
        `🏘 *Type:* ${s.propertyType}\n` +
        `💰 *${t.price}:* ${(s.price).toLocaleString()} ETB` +
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
    const t = i18n_1.i18n.get(ctx.session?.language);
    if (!ctx.message || !('text' in ctx.message))
        return;
    if (ctx.message.text === t.cancelBtn || ctx.message.text === '❌ Cancel')
        return cancelPost(ctx);
    if (ctx.message.text !== t.confirmBtn) {
        await ctx.reply(`Please press *${t.confirmBtn}* or *${t.cancelBtn}*.`, { parse_mode: 'Markdown' });
        return;
    }
    await ctx.reply('⏳ Publishing your listing...', telegraf_1.Markup.removeKeyboard());
    const s = ctx.wizard.state;
    const propertyData = {
        property_type: s.propertyType,
        location: s.location,
        price: s.price,
        bedrooms: s.bedrooms,
        description: s.description,
        contact_phone: s.contactPhone,
        images: s.photos || [],
        agency_id: null,
        channel_message_id: null,
    };
    // 1. Save to Supabase
    const saved = await (0, db_1.insertProperty)(propertyData);
    if (!saved) {
        await ctx.reply('❌ Failed to save your listing to the database. Please try again.');
        return ctx.scene.leave();
    }
    // 2. Publish to channel
    const channelMsgId = await (0, channel_1.publishToChannel)(_bot, saved);
    if (channelMsgId) {
        await (0, db_1.updateChannelMessageId)(saved.id, channelMsgId);
    }
    // 3. Build viral share link for landlord
    const listingUrl = (0, formatting_1.buildListingLink)(saved.id);
    const shareText = encodeURIComponent(`🏠 New listing on Gojo Homes!\n📍 ${saved.location}\n💰 ${saved.price.toLocaleString()} ETB\n\nCheck it out: ${listingUrl}`);
    const shareLink = `https://t.me/share/url?url=${encodeURIComponent(listingUrl)}&text=${shareText}`;
    const listingId = (0, formatting_1.shortId)(saved.id);
    await ctx.reply(`${t.postSuccess}\n\n` +
        `🆔 *Listing ID:* \`${listingId}\`\n\n` +
        `Share your listing in Telegram groups to find renters faster 👇`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '📢 Share Listing in Groups', url: shareLink }]],
        },
    });
    logger_1.logger.info(`New listing saved: id=${saved.id}, location=${saved.location}`);
    return ctx.scene.leave();
});
// ─── Helper ───────────────────────────────────────────────────────────────────
const cancelPost = async (ctx) => {
    const t = i18n_1.i18n.get(ctx.session?.language);
    await ctx.reply('❌ Listing cancelled. Use /start to go back to the main menu.', telegraf_1.Markup.removeKeyboard());
    return ctx.scene.leave();
};
