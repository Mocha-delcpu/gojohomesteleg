-- Supabase Schema for Gojo Homes properties marketplace

-- Create Agencies table
CREATE TABLE public.agencies (
  agency_id TEXT PRIMARY KEY, -- String identifier, e.g., 'agency_sunrise'
  agency_name TEXT NOT NULL,
  phone_number TEXT,
  description TEXT,
  verified_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We use RLS (Row Level Security) and enable it for proper security, 
-- but assuming the bot will use a Service Role Key, it can bypass RLS for inserting/reading.

-- Create Properties Table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type TEXT NOT NULL, -- e.g., 'Apartment', 'Villa'
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER,
  description TEXT,
  contact_phone TEXT NOT NULL,
  images TEXT[], -- array of telegram file_ids or URLs
  agency_id TEXT REFERENCES public.agencies(agency_id),
  channel_message_id INTEGER, -- To link to the post in the telegram channel
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create some indexes to optimize searching
CREATE INDEX idx_properties_location ON public.properties(location);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);
