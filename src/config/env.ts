import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvConfig {
  BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  CHANNEL_IDS: string;
  ADMIN_IDS: number[];
}

export const env: EnvConfig = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  CHANNEL_IDS: process.env.CHANNEL_IDS || '', 
  ADMIN_IDS: process.env.ADMIN_IDS 
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [],
};

// Validate critical variables
if (!env.BOT_TOKEN) {
  console.warn('Warning: BOT_TOKEN is missing from .env');
}
if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_KEY is missing from .env');
}
