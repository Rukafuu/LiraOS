import { IS_DESKTOP } from '../src/config';

/**
 * Universal Fetch Wrapper
 * Automatically switches between Native Browser Fetch (Web) and Tauri Rust Fetch (Desktop)
 * to bypass CORS issues in the Desktop environment.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (IS_DESKTOP) {
    try {
      // Dynamic import to prevent crash on Web (where Tauri plugin is missing internals)
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      
      // Tauri fetch signature is compatible with standard fetch
      const response = await tauriFetch(input as string, init);
      return response;
    } catch (error) {
      console.error('Tauri Fetch Error:', error);
      throw error;
    }
  } else {
    // Standard Browser Fetch
    return window.fetch(input, init);
  }
}
