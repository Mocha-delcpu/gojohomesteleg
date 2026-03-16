import { supabase } from './supabase';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Property {
  id?: string;
  property_type: string;
  location: string;
  price: number;
  bedrooms: number;
  description: string;
  contact_phone: string;
  images: string[];
  agency_id?: string | null;
  channel_message_id?: number | null;
  created_at?: string;
}

export interface Agency {
  agency_id: string;
  agency_name: string;
  phone_number: string;
  description: string;
  verified_status: boolean;
  created_at?: string;
}

// ─── Property Queries ─────────────────────────────────────────────────────────

/**
 * Insert a new property listing into Supabase.
 * Returns the full inserted row (including the generated UUID).
 */
export const insertProperty = async (data: Omit<Property, 'id' | 'created_at'>): Promise<Property | null> => {
  const { data: result, error } = await supabase
    .from('properties')
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error('Error inserting property:', error.message);
    return null;
  }
  return result as Property;
};

/**
 * Update the channel_message_id on a property so we can link to the post later.
 */
export const updateChannelMessageId = async (propertyId: string, messageId: number): Promise<void> => {
  const { error } = await supabase
    .from('properties')
    .update({ channel_message_id: messageId })
    .eq('id', propertyId);

  if (error) {
    logger.error('Error updating channel_message_id:', error.message);
  }
};

/**
 * Search properties by location, type, and max price.
 */
export const searchProperties = async (
  location: string,
  propertyType: string,
  minPrice: number,
  maxPrice: number
): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('location', `%${location}%`)
    .ilike('property_type', propertyType === 'any' ? '%' : propertyType)
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Error searching properties:', error.message);
    return [];
  }
  return (data as Property[]) || [];
};

/**
 * Fetch the latest N listings.
 */
export const getLatestListings = async (limit = 8): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching latest listings:', error.message);
    return [];
  }
  return (data as Property[]) || [];
};

/**
 * Get a single property by ID.
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching property by id:', error.message);
    return null;
  }
  return data as Property;
};

/**
 * Delete a property listing.
 */
export const deleteProperty = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting property:', error.message);
    return false;
  }
  return true;
};

/**
 * List all properties (for admin use).
 */
export const listAllProperties = async (limit = 20): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error listing properties:', error.message);
    return [];
  }
  return (data as Property[]) || [];
};

// ─── Agency Queries ───────────────────────────────────────────────────────────

/**
 * Get an agency profile by its text ID (e.g. 'sunrise').
 */
export const getAgencyById = async (agencyId: string): Promise<Agency | null> => {
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('agency_id', agencyId)
    .single();

  if (error) {
    logger.error('Error fetching agency:', error.message);
    return null;
  }
  return data as Agency;
};

/**
 * Get all properties listed by a specific agency.
 */
export const getAgencyProperties = async (agencyId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching agency properties:', error.message);
    return [];
  }
  return (data as Property[]) || [];
};

/**
 * Set verified_status = true for an agency.
 */
export const verifyAgency = async (agencyId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('agencies')
    .update({ verified_status: true })
    .eq('agency_id', agencyId);

  if (error) {
    logger.error('Error verifying agency:', error.message);
    return false;
  }
  return true;
};
