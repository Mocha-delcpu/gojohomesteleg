"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildListingLink = exports.buildSearchLink = exports.channelPostButtons = exports.formatListing = exports.shortId = void 0;
/**
 * Generates a short, human-readable listing ID like GH-1A2B from a UUID.
 */
const shortId = (uuid) => {
    return 'GH-' + uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
};
exports.shortId = shortId;
/**
 * Formats a property listing as a rich Telegram message.
 */
const formatListing = (property) => {
    const id = (0, exports.shortId)(property.id);
    const bedroomLine = property.bedrooms > 0 ? `🛏 *Bedrooms:* ${property.bedrooms}\n` : '';
    return (`🏠 *${property.property_type} for Rent/Sale*\n` +
        `📍 *Location:* ${property.location}\n` +
        `💰 *Price:* ${property.price.toLocaleString()} ETB\n` +
        `${bedroomLine}` +
        `\n📝 *Description:*\n${property.description}\n` +
        `\n📞 *Contact:* ${property.contact_phone}\n` +
        `🆔 *Listing ID:* \`${id}\``);
};
exports.formatListing = formatListing;
/**
 * Builds the inline keyboard buttons for a channel post.
 * Each button deep-links back to the bot.
 */
const channelPostButtons = (property) => {
    const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
    const loc = encodeURIComponent(property.location.toLowerCase().replace(/\s/g, ''));
    const type = property.property_type.toLowerCase();
    return {
        inline_keyboard: [
            [
                {
                    text: '💸 Find Cheaper Homes',
                    url: `https://t.me/${botUsername}?start=search_${loc}_0_${Math.floor(property.price * 0.8)}_${type}`,
                },
            ],
            [
                {
                    text: `📍 Find Homes in ${property.location}`,
                    url: `https://t.me/${botUsername}?start=search_${loc}_0_999999_${type === 'any' ? 'any' : 'any'}`,
                },
            ],
            [
                {
                    text: `🔍 Find Similar ${property.property_type}s`,
                    url: `https://t.me/${botUsername}?start=search_${loc}_${Math.max(0, property.price - 5000)}_${property.price + 5000}_${type}`,
                },
            ],
        ],
    };
};
exports.channelPostButtons = channelPostButtons;
/**
 * Builds a shareable search deep-link for a given search.
 */
const buildSearchLink = (location, minPrice, maxPrice, type) => {
    const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
    const loc = location.toLowerCase().replace(/\s/g, '');
    const t = type.toLowerCase();
    return `https://t.me/${botUsername}?start=search_${loc}_${minPrice}_${maxPrice}_${t}`;
};
exports.buildSearchLink = buildSearchLink;
/**
 * Builds a shareable link directly to a specific listing.
 */
const buildListingLink = (propertyId) => {
    const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
    return `https://t.me/${botUsername}?start=listing_${propertyId}`;
};
exports.buildListingLink = buildListingLink;
