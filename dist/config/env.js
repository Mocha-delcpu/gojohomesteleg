"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.env = {
    BOT_TOKEN: process.env.BOT_TOKEN || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    CHANNEL_IDS: process.env.CHANNEL_IDS || '',
    ADMIN_IDS: process.env.ADMIN_IDS
        ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
        : [],
};
// Validate critical variables
if (!exports.env.BOT_TOKEN) {
    console.warn('Warning: BOT_TOKEN is missing from .env');
}
if (!exports.env.SUPABASE_URL || !exports.env.SUPABASE_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_KEY is missing from .env');
}
