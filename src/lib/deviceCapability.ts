export type PerformanceTier = 'high' | 'medium' | 'low' | 'none';

export interface TierConfig {
  particleCount: number;
  fboWidth: number;
  fboHeight: number;
  bloom: boolean;
  bloomIntensity: number;
  dpr: [number, number];
  pointSize: number;
  maxFps: number;
}

export const TIER_CONFIGS: Record<PerformanceTier, TierConfig> = {
  high: {
    particleCount: 512,
    fboWidth: 32,
    fboHeight: 16,
    bloom: true,
    bloomIntensity: 0.5,
    dpr: [1, 2],
    pointSize: 45,
    maxFps: 60,
  },
  medium: {
    particleCount: 256,
    fboWidth: 16,
    fboHeight: 16,
    bloom: true,
    bloomIntensity: 0.3,
    dpr: [1, 1],
    pointSize: 40,
    maxFps: 60,
  },
  low: {
    particleCount: 128,
    fboWidth: 16,
    fboHeight: 8,
    bloom: false,
    bloomIntensity: 0,
    dpr: [0.75, 0.75],
    pointSize: 35,
    maxFps: 30,
  },
  none: {
    particleCount: 0,
    fboWidth: 0,
    fboHeight: 0,
    bloom: false,
    bloomIntensity: 0,
    dpr: [1, 1],
    pointSize: 0,
    maxFps: 0,
  },
};

/**
 * Detects device capability and returns a performance tier.
 * Checks WebGL support, hardware concurrency, screen size, and motion preferences.
 */
export function detectDeviceCapability(): PerformanceTier {
  // Check prefers-reduced-motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none';
  }

  // Check WebGL support
  if (!hasWebGLSupport()) {
    return 'none';
  }

  // Check if mobile (screen size)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Check hardware concurrency
  const cores = navigator.hardwareConcurrency || 2;

  // Determine tier
  if (isMobile) {
    // Mobile devices cap at medium
    return cores >= 4 ? 'medium' : 'low';
  }

  // Desktop
  if (cores >= 8) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

/**
 * Checks for WebGL 2 support with float textures (required for GPGPU).
 */
function hasWebGLSupport(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    // WebGL2 natively supports float textures — just check it exists
    if (gl) return true;

    // WebGL1 fallback — needs OES_texture_float extension
    const gl1 = canvas.getContext('webgl');
    if (!gl1) return false;
    const floatExt = gl1.getExtension('OES_texture_float');
    return floatExt !== null;
  } catch {
    return false;
  }
}

/**
 * FPS Monitor - tracks frame rate and triggers tier downgrade if needed.
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = 0;
  private lowFpsStart = 0;
  private readonly LOW_FPS_THRESHOLD = 30;
  private readonly LOW_FPS_DURATION = 3000; // 3 seconds
  private onDowngrade: (() => void) | null = null;

  constructor(onDowngrade?: () => void) {
    this.onDowngrade = onDowngrade || null;
  }

  tick(timestamp: number): number {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return 60;
    }

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (delta > 0) {
      const fps = 1000 / delta;
      this.frames.push(fps);

      // Keep last 60 frames
      if (this.frames.length > 60) this.frames.shift();
    }

    const avgFps = this.getAverageFPS();

    // Check for sustained low FPS
    if (avgFps < this.LOW_FPS_THRESHOLD) {
      if (this.lowFpsStart === 0) {
        this.lowFpsStart = timestamp;
      } else if (timestamp - this.lowFpsStart > this.LOW_FPS_DURATION) {
        this.lowFpsStart = 0;
        this.onDowngrade?.();
      }
    } else {
      this.lowFpsStart = 0;
    }

    return avgFps;
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;
    return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }
}
