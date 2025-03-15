/**
 * Server-side constants
 */

import path from 'path';
import os from 'os';

// Base data directory
export const DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), '.openwebui');

// Extensions directory
export const EXTENSIONS_DIR = process.env.EXTENSIONS_DIR || path.join(DATA_DIR, 'extensions');

// Public extensions directory (for serving static assets)
export const PUBLIC_EXTENSIONS_DIR = path.join(process.cwd(), 'static', 'extensions');
