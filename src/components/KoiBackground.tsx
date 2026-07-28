import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import GPGPUParticles from './particles/GPGPUParticles';
import {
  detectDeviceCapability,
  TIER_CONFIGS,
  FPSMonitor,
  type PerformanceTier,
  type TierConfig,
} from '../lib/deviceCapability';

/** Bloom wrapper that adapts to theme and tier */
function AdaptiveBloom({ intensity }: { intensity: number }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme !== 'light');
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const effectiveIntensity = isDark ? intensity : intensity * 0.5;

  return (
    <EffectComposer>
      <Bloom
        intensity={effectiveIntensity}
        luminanceThreshold={isDark ? 0.4 : 0.6}
        luminanceSmoothing={0.9}
        radius={0.8}
        mipmapBlur
      />
    </EffectComposer>
  );
}

/** Component that pauses rendering when document is hidden */
function VisibilityPauser() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useFrame((state) => {
    if (!visible) {
      // Pause the clock when hidden to save resources
      state.clock.stop();
    } else if (!state.clock.running) {
      state.clock.start();
    }
  });

  return null;
}

/** FPS monitoring component that can trigger tier downgrade */
function FPSTracker({ onDowngrade }: { onDowngrade: () => void }) {
  const monitorRef = useRef(new FPSMonitor(onDowngrade));

  useFrame((state) => {
    monitorRef.current.tick(state.clock.getElapsedTime() * 1000);
  });

  return null;
}

/** CSS-only fallback for devices that can't run WebGL */
function CSSFallback() {
  return (
    <div
      className="koi-fallback"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Full-screen fixed canvas background for the generative koi pond effect */
export default function KoiBackground() {
  const [tier, setTier] = useState<PerformanceTier | null>(null);
  const [config, setConfig] = useState<TierConfig | null>(null);

  useEffect(() => {
    const detectedTier = detectDeviceCapability();
    setTier(detectedTier);
    setConfig(TIER_CONFIGS[detectedTier]);
  }, []);

  const handleDowngrade = useCallback(() => {
    setTier((current) => {
      if (current === 'high') {
        const newTier = 'medium';
        setConfig(TIER_CONFIGS[newTier]);
        return newTier;
      }
      if (current === 'medium') {
        const newTier = 'low';
        setConfig(TIER_CONFIGS[newTier]);
        return newTier;
      }
      // Already at low — switch to CSS fallback
      const newTier = 'none';
      setConfig(TIER_CONFIGS[newTier]);
      return newTier;
    });
  }, []);

  // Waiting for detection
  if (tier === null || config === null) return null;

  // CSS fallback for 'none' tier
  if (tier === 'none') return <CSSFallback />;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <Canvas
        dpr={config.dpr}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], fov: 60 }}
        frameloop={config.maxFps <= 30 ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <GPGPUParticles />
          {config.bloom && <AdaptiveBloom intensity={config.bloomIntensity} />}
          <VisibilityPauser />
          <FPSTracker onDowngrade={handleDowngrade} />
        </Suspense>
      </Canvas>
    </div>
  );
}
