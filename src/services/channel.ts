import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Property } from '../services/db';
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

    const channels = env.CHANNEL_IDS.split(',').map(c => c.trim()).filter(Boolean);
    let primaryMessageId: number | null = null;
    
    for (const channel of channels) {
      try {
        let sentMessage: any;
        if (property.images && property.images.length > 0) {
          // Post with photo
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
        // Save the first successful message ID as the primary one for deep linking
        if (!primaryMessageId) {
          primaryMessageId = sentMessage.message_id;
        }
      } catch (err: any) {
        logger.error(`Failed to post to channel ${channel}: ${err.message}`);
      }
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
    const primaryChannel = env.CHANNEL_IDS.split(',')[0].trim();
    await bot.telegram.deleteMessage(primaryChannel, messageId);
    logger.info(`Deleted channel message ${messageId} from ${primaryChannel}`);
  } catch (error: any) {
    logger.error('Failed to delete channel message:', error.message);
  }
};
