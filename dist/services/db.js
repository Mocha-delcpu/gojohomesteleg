"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDestinationChannel = exports.getDestinationChannel = exports.verifyAgency = exports.getAgencyProperties = exports.getAgencyById = exports.listAllProperties = exports.deleteProperty = exports.getPropertyById = exports.getLatestListings = exports.searchProperties = exports.updateChannelMessageId = exports.insertProperty = void 0;
const supabase_1 = require("./supabase");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
// ─── Property Queries ─────────────────────────────────────────────────────────
/**
 * Insert a new property listing into Supabase.
 * Returns the full inserted row (including the generated UUID).
 */
const insertProperty = async (data) => {
    const { data: result, error } = await supabase_1.supabase
        .from('properties')
        .insert(data)
        .select()
        .single();
    if (error) {
        logger_1.logger.error('Error inserting property:', error.message);
        return null;
    }
    return result;
};
exports.insertProperty = insertProperty;
/**
 * Update the channel_message_id on a property so we can link to the post later.
 */
const updateChannelMessageId = async (propertyId, messageId) => {
    const { error } = await supabase_1.supabase
        .from('properties')
        .update({ channel_message_id: messageId })
        .eq('id', propertyId);
    if (error) {
        logger_1.logger.error('Error updating channel_message_id:', error.message);
    }
};
exports.updateChannelMessageId = updateChannelMessageId;
/**
 * Search properties by location, type, and max price.
 */
const searchProperties = async (location, propertyType, minPrice, maxPrice) => {
    const { data, error } = await supabase_1.supabase
        .from('properties')
        .select('*')
        .ilike('location', `%${location}%`)
        .ilike('property_type', propertyType === 'any' ? '%' : propertyType)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('created_at', { ascending: false })
        .limit(10);
    if (error) {
        logger_1.logger.error('Error searching properties:', error.message);
        return [];
    }
    return data || [];
};
exports.searchProperties = searchProperties;
/**
 * Fetch the latest N listings.
 */
const getLatestListings = async (limit = 8) => {
    const { data, error } = await supabase_1.supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) {
        logger_1.logger.error('Error fetching latest listings:', error.message);
        return [];
    }
    return data || [];
};
exports.getLatestListings = getLatestListings;
/**
 * Get a single property by ID.
 */
const getPropertyById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        logger_1.logger.error('Error fetching property by id:', error.message);
        return null;
    }
    return data;
};
exports.getPropertyById = getPropertyById;
/**
 * Delete a property listing.
 */
const deleteProperty = async (id) => {
    const { error } = await supabase_1.supabase.from('properties').delete().eq('id', id);
    if (error) {
        logger_1.logger.error('Error deleting property:', error.message);
        return false;
    }
    return true;
};
exports.deleteProperty = deleteProperty;
/**
 * List all properties (for admin use).
 */
const listAllProperties = async (limit = 20) => {
    const { data, error } = await supabase_1.supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) {
        logger_1.logger.error('Error listing properties:', error.message);
        return [];
    }
    return data || [];
};
exports.listAllProperties = listAllProperties;
// ─── Agency Queries ───────────────────────────────────────────────────────────
/**
 * Get an agency profile by its text ID (e.g. 'sunrise').
 */
const getAgencyById = async (agencyId) => {
    const { data, error } = await supabase_1.supabase
        .from('agencies')
        .select('*')
        .eq('agency_id', agencyId)
        .single();
    if (error) {
        logger_1.logger.error('Error fetching agency:', error.message);
        return null;
    }
    return data;
};
exports.getAgencyById = getAgencyById;
/**
 * Get all properties listed by a specific agency.
 */
const getAgencyProperties = async (agencyId) => {
    const { data, error } = await supabase_1.supabase
        .from('properties')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
    if (error) {
        logger_1.logger.error('Error fetching agency properties:', error.message);
        return [];
    }
    return data || [];
};
exports.getAgencyProperties = getAgencyProperties;
/**
 * Set verified_status = true for an agency.
 */
const verifyAgency = async (agencyId) => {
    const { error } = await supabase_1.supabase
        .from('agencies')
        .update({ verified_status: true })
        .eq('agency_id', agencyId);
    if (error) {
        logger_1.logger.error('Error verifying agency:', error.message);
        return false;
    }
    return true;
};
exports.verifyAgency = verifyAgency;
// ─── Settings Queries ─────────────────────────────────────────────────────────
/**
 * Get the destination channel.
 * Reads from the 'settings' table. Falls back to env.CHANNEL_IDS if not set.
 */
const getDestinationChannel = async () => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('settings')
            .select('value')
            .eq('key', 'destination_channel')
            .maybeSingle();
        if (error || !data) {
            return env_1.env.CHANNEL_IDS.split(',')[0].trim();
        }
        return data.value;
    }
    catch (err) {
        return env_1.env.CHANNEL_IDS.split(',')[0].trim();
    }
};
exports.getDestinationChannel = getDestinationChannel;
/**
 * Set the destination channel.
 */
const setDestinationChannel = async (channelId) => {
    try {
        const { data } = await supabase_1.supabase.from('settings').select('key').eq('key', 'destination_channel').maybeSingle();
        if (data) {
            const { error } = await supabase_1.supabase.from('settings').update({ value: channelId }).eq('key', 'destination_channel');
            return !error;
        }
        else {
            const { error } = await supabase_1.supabase.from('settings').insert({ key: 'destination_channel', value: channelId });
            return !error;
        }
    }
    catch (err) {
        logger_1.logger.error('Error setting destination channel:', err.message);
        return false;
    }
};
exports.setDestinationChannel = setDestinationChannel;
