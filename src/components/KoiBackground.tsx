import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import GPGPUParticles from './particles/GPGPUParticles';
import {
  detectDeviceCapability,
  TIER_CONFIGS,
  FPSMonitor,
  type PerformanceTier,
  type TierConfig,
} from '../lib/deviceCapability';

function ThemeBackground() {
  const { scene } = useThree();
  useEffect(() => {
    const updateBg = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      scene.background = new THREE.Color(theme === 'light' ? '#fafaf9' : '#0a0a0a');
    };
    updateBg();
    const observer = new MutationObserver(updateBg);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [scene]);
  return null;
}

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
  return (
    <EffectComposer>
      <Bloom
        intensity={isDark ? intensity : intensity * 0.4}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        radius={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}

function VisibilityPauser() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  useFrame((state) => {
    if (!visible) state.clock.stop();
    else if (!state.clock.running) state.clock.start();
  });
  return null;
}

function FPSTracker({ onDowngrade }: { onDowngrade: () => void }) {
  const monitorRef = useRef(new FPSMonitor(onDowngrade));
  useFrame((state) => {
    monitorRef.current.tick(state.clock.getElapsedTime() * 1000);
  });
  return null;
}

function CSSFallback() {
  return (
    <div
      className="koi-fallback"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    />
  );
}

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
      let newTier: PerformanceTier;
      if (current === 'high') newTier = 'medium';
      else if (current === 'medium') newTier = 'low';
      else newTier = 'none';
      setConfig(TIER_CONFIGS[newTier]);
      return newTier;
    });
  }, []);

  if (tier === null || config === null) return null;
  if (tier === 'none') return <CSSFallback />;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <Canvas
        dpr={config.dpr}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], fov: 60 }}
        frameloop="always"
      >
        <ThemeBackground />
        <Suspense fallback={null}>
          <GPGPUParticles />
          {config.bloom && <AdaptiveBloom intensity={0.15} />}
          <VisibilityPauser />
          <FPSTracker onDowngrade={handleDowngrade} />
        </Suspense>
      </Canvas>
    </div>
  );
}
