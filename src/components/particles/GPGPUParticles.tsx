import { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGPGPU } from './useGPGPU';

import particlesVert from './shaders/particles.vert?raw';
import particlesFrag from './shaders/particles.frag?raw';

import palettesData from '../../data/palettes.json';
import silhouettesData from '../../data/silhouettes.json';

// Type the imported data
const palettes = palettesData as Record<string, string[]>;
const silhouettes = silhouettesData as Record<string, number[][]>;

const familyNames = Object.keys(palettes);

/** Convert hex string to THREE.Color */
function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Lerp between two THREE.Color objects */
function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().copy(a).lerp(b, t);
}

export default function GPGPUParticles() {
  const { viewport } = useThree();
  const { simulate, getPositionTexture, particleCount, fboWidth, fboHeight, material: simMaterial } = useGPGPU();

  // --- Palette state ---
  const paletteRef = useRef({
    currentFamily: familyNames[Math.floor(Math.random() * familyNames.length)],
    nextFamily: familyNames[Math.floor(Math.random() * familyNames.length)],
    transitionProgress: 0,
    lastSwitch: 0,
    switchInterval: 35 + Math.random() * 25, // 35-60 seconds
  });

  // --- Attractor state ---
  const attractorRef = useRef({
    active: false,
    points: [] as number[][],
    strength: 0,
    targetStrength: 0,
    holdStart: 0,
    holdDuration: 3,
    lastTrigger: 0,
    triggerInterval: 55 + Math.random() * 35, // 55-90 seconds
    phase: 'idle' as 'idle' | 'forming' | 'holding' | 'dissolving',
  });

  // --- Theme state ---
  const themeRef = useRef<'dark' | 'light'>('dark');

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
      themeRef.current = theme || 'dark';
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const { geometry, material } = useMemo(() => {
    const indices = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      indices[i] = i;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    geo.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));

    const initialPalette = palettes[paletteRef.current.currentFamily] || ['#4488ff', '#22ccaa', '#ff6644', '#ffaa22', '#8844ff'];

    const mat = new THREE.ShaderMaterial({
      vertexShader: particlesVert,
      fragmentShader: particlesFrag,
      uniforms: {
        uPositions: { value: null },
        uResolution: { value: new THREE.Vector2(fboWidth, fboHeight) },
        uPointSize: { value: 45.0 },
        uAspect: { value: viewport.aspect },
        uColor1: { value: hexToColor(initialPalette[0]) },
        uColor2: { value: hexToColor(initialPalette[1]) },
        uColor3: { value: hexToColor(initialPalette[2]) },
        uColor4: { value: hexToColor(initialPalette[3]) },
        uColor5: { value: hexToColor(initialPalette[4]) },
        uOpacity: { value: 0.85 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    return { geometry: geo, material: mat };
  }, [particleCount, fboWidth, fboHeight, viewport.aspect]);

  // --- Palette cycling logic ---
  const updatePalette = useCallback((elapsed: number) => {
    const ps = paletteRef.current;

    // Check if it's time to start a new transition
    if (elapsed - ps.lastSwitch > ps.switchInterval && ps.transitionProgress >= 1.0) {
      ps.currentFamily = ps.nextFamily;
      // Pick a new target family (different from current)
      let next = familyNames[Math.floor(Math.random() * familyNames.length)];
      while (next === ps.currentFamily && familyNames.length > 1) {
        next = familyNames[Math.floor(Math.random() * familyNames.length)];
      }
      ps.nextFamily = next;
      ps.transitionProgress = 0;
      ps.lastSwitch = elapsed;
      ps.switchInterval = 35 + Math.random() * 25;
    }

    // Advance transition (takes ~5 seconds to complete)
    if (ps.transitionProgress < 1.0) {
      ps.transitionProgress = Math.min(1.0, ps.transitionProgress + 0.003);
    }

    // Interpolate colors
    const currentColors = palettes[ps.currentFamily] || ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
    const nextColors = palettes[ps.nextFamily] || ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
    const t = smoothstep(ps.transitionProgress);

    // Theme-based adjustments
    const isDark = themeRef.current === 'dark';
    const brightnessMultiplier = isDark ? 1.2 : 0.7;
    const saturationBoost = isDark ? 1.1 : 0.85;

    for (let i = 0; i < 5; i++) {
      const c = lerpColor(hexToColor(currentColors[i]), hexToColor(nextColors[i]), t);
      // Apply theme brightness/saturation
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      hsl.l = Math.min(1.0, hsl.l * brightnessMultiplier);
      hsl.s = Math.min(1.0, hsl.s * saturationBoost);
      c.setHSL(hsl.h, hsl.s, hsl.l);

      const uniform = material.uniforms[`uColor${i + 1}` as keyof typeof material.uniforms];
      if (uniform) (uniform.value as THREE.Color).copy(c);
    }

    // Adjust opacity based on theme
    material.uniforms.uOpacity.value = isDark ? 0.85 : 0.6;
  }, [material]);

  // --- Attractor logic ---
  const updateAttractors = useCallback((elapsed: number) => {
    const att = attractorRef.current;

    switch (att.phase) {
      case 'idle':
        if (elapsed - att.lastTrigger > att.triggerInterval) {
          // Start forming a fish silhouette
          const family = familyNames[Math.floor(Math.random() * familyNames.length)];
          const points = silhouettes[family];
          if (points && points.length > 3) {
            att.points = points;
            att.phase = 'forming';
            att.targetStrength = 1.0;
            att.lastTrigger = elapsed;
            att.triggerInterval = 55 + Math.random() * 35;
          }
        }
        break;

      case 'forming':
        att.strength = Math.min(att.targetStrength, att.strength + 0.004);
        if (att.strength >= att.targetStrength) {
          att.phase = 'holding';
          att.holdStart = elapsed;
        }
        break;

      case 'holding':
        if (elapsed - att.holdStart > att.holdDuration) {
          att.phase = 'dissolving';
        }
        break;

      case 'dissolving':
        att.strength = Math.max(0, att.strength - 0.006);
        if (att.strength <= 0) {
          att.phase = 'idle';
          att.active = false;
          att.points = [];
        }
        break;
    }

    // Pass attractor data to simulation material
    if (att.points.length > 0 && att.strength > 0) {
      simMaterial.uniforms.uCenterGravity.value = 0.008 + att.strength * 0.015;
    } else {
      simMaterial.uniforms.uCenterGravity.value = 0.008;
    }
  }, [simMaterial]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Run simulation
    simulate(delta);

    // Update rendering
    material.uniforms.uPositions.value = getPositionTexture();
    material.uniforms.uAspect.value = viewport.aspect;

    // Update palette colors
    updatePalette(elapsed);

    // Update attractors
    updateAttractors(elapsed);
  });

  return (
    <points geometry={geometry} material={material} frustumCulled={false} />
  );
}

/** Smoothstep interpolation */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
