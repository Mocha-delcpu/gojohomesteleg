import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Property, getDestinationChannel } from '../services/db';
import { formatListing, channelPostButtons } from '../utils/formatting';

/**
 * Publishes a property listing to the Telegram channel.
 * Returns the Telegram message ID of the channel post.
 */
export const publishToChannel = async (
  // Using 'any' to avoid generic type conflicts with Telegraf<MyContext> vs Telegraf
  bot: any,
  property: Property
): Promise<number | null> => {
  try {
    const caption = formatListing(property);
    const buttons = channelPostButtons(property);

    const channel = await getDestinationChannel();
    let primaryMessageId: number | null = null;
    
    try {
      let sentMessage: any;
      if (property.images && property.images.length > 1) {
        // Post as media group for multiple photos
        const mediaGroup = property.images.map((img, i) => ({
          type: 'photo' as const,
          media: img,
          caption: i === 0 ? caption : undefined,
          parse_mode: 'Markdown' as const,
        }));
        
        // sendMediaGroup returns an array of messages
        const messages = await bot.telegram.sendMediaGroup(channel, mediaGroup);
        sentMessage = messages[0];
        
        // Inline keyboards cannot be attached directly to a media group, so we send a follow-up reply
        await bot.telegram.sendMessage(channel, '👇 Contact options:', {
          reply_to_message_id: sentMessage.message_id,
          reply_markup: buttons,
        });

      } else if (property.images && property.images.length === 1) {
        // Post with single photo
        sentMessage = await bot.telegram.sendPhoto(
          channel,
          property.images[0],
          {
            caption,
            parse_mode: 'Markdown',
            reply_markup: buttons,
          }
        );
      } else {
        // Post as text only
        sentMessage = await bot.telegram.sendMessage(channel, caption, {
          parse_mode: 'Markdown',
          reply_markup: buttons,
        });
      }
      
      logger.info(`Published listing ${property.id} to channel ${channel}, message_id=${sentMessage.message_id}`);
      primaryMessageId = sentMessage.message_id;
    } catch (err: any) {
      logger.error(`Failed to post to channel ${channel}: ${err.message}`);
    }

    return primaryMessageId;
  } catch (error: any) {
    logger.error('Failed to publish to channel:', error.message);
    return null;
  }
};

/**
 * Deletes a post from the Telegram channel by its message ID.
 */
export const deleteFromChannel = async (bot: any, messageId: number): Promise<void> => {
  try {
    const primaryChannel = await getDestinationChannel();
    await bot.telegram.deleteMessage(primaryChannel, messageId);
    logger.info(`Deleted channel message ${messageId} from ${primaryChannel}`);
  } catch (error: any) {
    logger.error('Failed to delete channel message:', error.message);
  }
};
