/**
 * Server-side authentication helpers
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Get the user token from cookies or header
 * @param request The HTTP request
 * @param locals The request locals
 * @returns The user token or null
 */
export async function getUserToken(request: Request, locals: App.Locals): Promise<string | null> {
  // Check cookie
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Check auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/Bearer\s+(.+)/i);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Verify that the user is an admin
 * @param token The user token
 * @returns True if the user is an admin
 */
export async function verifyAdmin(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${WEBUI_API_BASE_URL}/admin/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.is_admin === true;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}
