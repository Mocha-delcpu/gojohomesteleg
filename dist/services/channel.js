"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromChannel = exports.publishToChannel = void 0;
const logger_1 = require("../utils/logger");
const db_1 = require("../services/db");
const formatting_1 = require("../utils/formatting");
/**
 * Publishes a property listing to the Telegram channel.
 * Returns the Telegram message ID of the channel post.
 */
const publishToChannel = async (
// Using 'any' to avoid generic type conflicts with Telegraf<MyContext> vs Telegraf
bot, property) => {
    try {
        const caption = (0, formatting_1.formatListing)(property);
        const buttons = (0, formatting_1.channelPostButtons)(property);
        const channel = await (0, db_1.getDestinationChannel)();
        let primaryMessageId = null;
        try {
            let sentMessage;
            if (property.images && property.images.length > 1) {
                // Post as media group for multiple photos
                const mediaGroup = property.images.map((img, i) => ({
                    type: 'photo',
                    media: img,
                    caption: i === 0 ? caption : undefined,
                    parse_mode: 'Markdown',
                }));
                // sendMediaGroup returns an array of messages
                const messages = await bot.telegram.sendMediaGroup(channel, mediaGroup);
                sentMessage = messages[0];
                // Inline keyboards cannot be attached directly to a media group, so we send a follow-up reply
                await bot.telegram.sendMessage(channel, '👇 Contact options:', {
                    reply_to_message_id: sentMessage.message_id,
                    reply_markup: buttons,
                });
            }
            else if (property.images && property.images.length === 1) {
                // Post with single photo
                sentMessage = await bot.telegram.sendPhoto(channel, property.images[0], {
                    caption,
                    parse_mode: 'Markdown',
                    reply_markup: buttons,
                });
            }
            else {
                // Post as text only
                sentMessage = await bot.telegram.sendMessage(channel, caption, {
                    parse_mode: 'Markdown',
                    reply_markup: buttons,
                });
            }
            logger_1.logger.info(`Published listing ${property.id} to channel ${channel}, message_id=${sentMessage.message_id}`);
            primaryMessageId = sentMessage.message_id;
        }
        catch (err) {
            logger_1.logger.error(`Failed to post to channel ${channel}: ${err.message}`);
        }
        return primaryMessageId;
    }
    catch (error) {
        logger_1.logger.error('Failed to publish to channel:', error.message);
        return null;
    }
};
exports.publishToChannel = publishToChannel;
/**
 * Deletes a post from the Telegram channel by its message ID.
 */
const deleteFromChannel = async (bot, messageId) => {
    try {
        const primaryChannel = await (0, db_1.getDestinationChannel)();
        await bot.telegram.deleteMessage(primaryChannel, messageId);
        logger_1.logger.info(`Deleted channel message ${messageId} from ${primaryChannel}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to delete channel message:', error.message);
    }
};
exports.deleteFromChannel = deleteFromChannel;
