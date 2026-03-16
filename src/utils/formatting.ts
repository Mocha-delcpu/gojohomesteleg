import { Property } from '../services/db';
import { env } from '../config/env';

/**
 * Generates a short, human-readable listing ID like GH-1A2B from a UUID.
 */
export const shortId = (uuid: string): string => {
  return 'GH-' + uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
};

/**
 * Formats a property listing as a rich Telegram message.
 */
export const formatListing = (property: Property): string => {
  const id = shortId(property.id!);
  const bedroomLine = property.bedrooms > 0 ? `🛏 *Bedrooms:* ${property.bedrooms}\n` : '';
  const typeStr = property.listing_type === 'rent' ? 'for Rent' : 'for Sale';

  return (
    `🏠 *${property.property_type} ${typeStr}*\n` +
    `📍 *Location:* ${property.location}\n` +
    `💰 *Price:* ${property.price.toLocaleString()} ETB\n` +
    `${bedroomLine}` +
    `\n📝 *Description:*\n${property.description}\n` +
    `\n📞 *Contact:* ${property.contact_phone}\n` +
    `🆔 *Listing ID:* \`${id}\``
  );
};

/**
 * Builds the inline keyboard buttons for a channel post.
 * Each button deep-links back to the bot.
 */
export const channelPostButtons = (property: Property) => {
  const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
  const loc = encodeURIComponent(property.location.toLowerCase().replace(/\s/g, ''));
  const type = property.property_type.toLowerCase();
  const listingType = property.listing_type;

  return {
    inline_keyboard: [
      [
        {
          text: '💸 Find Cheaper Homes',
          url: `https://t.me/${botUsername}?start=search_${loc}_${listingType}_0_${Math.floor(property.price * 0.8)}_${type}`,
        },
      ],
      [
        {
          text: `📍 Find Homes in ${property.location.split(' - ').pop() || property.location}`,
          url: `https://t.me/${botUsername}?start=search_${loc}_${listingType}_0_999999999_${type === 'any' ? 'any' : 'any'}`,
        },
      ],
      [
        {
          text: `🔍 Find Similar ${property.property_type}s`,
          url: `https://t.me/${botUsername}?start=search_${loc}_${listingType}_${Math.max(0, property.price - 5000)}_${property.price + 5000}_${type}`,
        },
      ],
    ],
  };
};

/**
 * Builds a shareable search deep-link for a given search.
 */
export const buildSearchLink = (location: string, listingType: 'rent' | 'sale' | 'any', minPrice: number, maxPrice: number, type: string): string => {
  const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
  const loc = encodeURIComponent(location.toLowerCase().replace(/\s/g, ''));
  const t = type.toLowerCase();
  return `https://t.me/${botUsername}?start=search_${loc}_${listingType}_${minPrice}_${maxPrice}_${t}`;
};

/**
 * Builds a shareable link directly to a specific listing.
 */
export const buildListingLink = (propertyId: string): string => {
  const botUsername = process.env.BOT_USERNAME || 'gojohomes_bot';
  return `https://t.me/${botUsername}?start=listing_${propertyId}`;
};
