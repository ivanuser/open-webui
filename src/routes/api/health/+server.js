/**
 * Health check endpoint
 * GET /api/health
 */

import { json } from '@sveltejs/kit';

/**
 * GET /api/health
 * Simple health check endpoint to verify API is accessible
 */
export async function GET() {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is functioning correctly'
  });
}
