/**
 * GPU Gate - Detects if the device can handle WebGL/Live2D rendering
 * 
 * This module prevents crashes on low-end devices by checking:
 * - WebGL availability
 * - Software rendering (SwiftShader, llvmpipe)
 * - Minimum GPU capabilities (texture size)
 * 
 * @module gpuGate
 */

export type GpuGateResult =
  | { ok: true; reason: string; renderer?: string; maxTex?: number }
  | { ok: false; reason: string; renderer?: string; maxTex?: number };

/**
 * Checks if the device has sufficient GPU capabilities for Live2D rendering
 * 
 * @returns Promise<GpuGateResult> - Result object with ok status and diagnostic info
 */
export async function gpuGate(): Promise<GpuGateResult> {
  // SSR Safety Check
  if (typeof window === 'undefined') {
    return {
      ok: false,
      reason: 'Running in server-side environment (no window object)',
    };
  }

  // Manual Override Check
  const forceEnabled = localStorage.getItem('forceLive2D') === 'true';
  if (forceEnabled) {
    console.warn('[GPU Gate] Manual override detected - forcing Live2D enabled');
    return {
      ok: true,
      reason: 'Manual override enabled (forceLive2D=true)',
    };
  }

  // Create temporary canvas for WebGL testing
  const canvas = document.createElement('canvas');
  let gl: WebGLRenderingContext | null = null;

  try {
    // Try to get WebGL context
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

    if (!gl) {
      return {
        ok: false,
        reason: 'WebGL not available - browser does not support WebGL',
      };
    }

    // Get renderer information
    let renderer = 'Unknown';
    let maxTextureSize = 0;

    try {
      // Try to get unmasked renderer info (may be blocked by privacy settings)
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      }
    } catch (e) {
      console.warn('[GPU Gate] Could not retrieve renderer info:', e);
    }

    // Get max texture size (critical capability indicator)
    try {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
    } catch (e) {
      console.warn('[GPU Gate] Could not retrieve MAX_TEXTURE_SIZE:', e);
    }

    // Check for software rendering (CPU-based, will cause severe lag)
    const rendererLower = renderer.toLowerCase();
    const softwareRenderers = ['swiftshader', 'llvmpipe', 'software', 'mesa'];
    const isSoftwareRenderer = softwareRenderers.some(sw => rendererLower.includes(sw));

    if (isSoftwareRenderer) {
      return {
        ok: false,
        reason: `Software renderer detected: ${renderer} - Live2D would cause severe lag`,
        renderer,
        maxTex: maxTextureSize,
      };
    }

    // Check minimum texture size (4096 is baseline for modern GPUs)
    const MIN_TEXTURE_SIZE = 4096;
    if (maxTextureSize > 0 && maxTextureSize <= MIN_TEXTURE_SIZE) {
      return {
        ok: false,
        reason: `GPU too weak - MAX_TEXTURE_SIZE: ${maxTextureSize} (minimum: ${MIN_TEXTURE_SIZE})`,
        renderer,
        maxTex: maxTextureSize,
      };
    }

    // All checks passed!
    return {
      ok: true,
      reason: 'GPU capable of Live2D rendering',
      renderer,
      maxTex: maxTextureSize,
    };

  } catch (error) {
    return {
      ok: false,
      reason: `WebGL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  } finally {
    // Cleanup
    if (gl) {
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
    canvas.remove();
  }
}

/**
 * Enables manual override to force Live2D on weak devices
 * WARNING: May cause crashes or severe performance issues
 */
export function enableLive2DOverride(): void {
  localStorage.setItem('forceLive2D', 'true');
  console.warn('[GPU Gate] Live2D override enabled - reload page to take effect');
}

/**
 * Disables manual override
 */
export function disableLive2DOverride(): void {
  localStorage.removeItem('forceLive2D');
  console.log('[GPU Gate] Live2D override disabled - reload page to take effect');
}

/**
 * Checks if manual override is currently active
 */
export function isOverrideActive(): boolean {
  return localStorage.getItem('forceLive2D') === 'true';
}
