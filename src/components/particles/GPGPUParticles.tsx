import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGPGPU } from './useGPGPU';

import particlesVert from './shaders/particles.vert?raw';
import particlesFrag from './shaders/particles.frag?raw';

import palettesData from '../../data/palettes.json';

const palettes = palettesData as Record<string, { colors: string[]; label: string }>;
const paletteNames = Object.keys(palettes);

/**
 * Attractor keyframes define sculptural configurations.
 * Each keyframe is an array of 4 attractor states: [x, y, z, strength]
 * The system interpolates between keyframes to create morphing form.
 */
const ATTRACTOR_KEYFRAMES: number[][][] = [
  // Compact central cluster — dense organism core
  [
    [0.0, 0.5, 0.0, 1.2],
    [0.8, -0.3, 0.3, 0.8],
    [-0.7, -0.2, -0.2, 0.9],
    [0.2, -0.8, -0.3, 0.7],
  ],
  // Vertical ribbon — elongated form
  [
    [0.0, 1.5, 0.0, 1.0],
    [0.3, 0.5, 0.2, 0.9],
    [-0.2, -0.5, -0.1, 0.9],
    [0.0, -1.5, 0.0, 1.0],
  ],
  // Orbital ring — particles form a spinning torus-like shape
  [
    [1.2, 0.0, 0.4, 0.9],
    [-1.2, 0.0, -0.4, 0.9],
    [0.0, 1.0, 0.3, 0.8],
    [0.0, -1.0, -0.3, 0.8],
  ],
  // Asymmetric drift — organic offset with depth
  [
    [-0.8, 0.8, 0.6, 1.1],
    [1.0, 0.3, -0.4, 0.7],
    [0.3, -0.9, 0.3, 0.9],
    [-0.5, -0.4, -0.6, 0.8],
  ],
  // Dispersed nebula — wider, breathing form
  [
    [0.5, 1.2, 0.5, 0.6],
    [-1.0, 0.0, -0.3, 0.7],
    [1.0, -0.8, 0.2, 0.6],
    [-0.3, -1.2, -0.4, 0.7],
  ],
  // Converging spiral
  [
    [0.0, 0.0, 0.0, 1.5],
    [1.5, 0.8, 0.3, 0.5],
    [-1.0, -1.0, -0.5, 0.5],
    [0.5, -0.5, 0.8, 0.6],
  ],
];

const KEYFRAME_DURATION = 12.0; // seconds per keyframe hold
const TRANSITION_DURATION = 6.0; // seconds to morph between keyframes

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function lerpVec4(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}

export default function GPGPUParticles() {
  const { viewport } = useThree();
  const {
    simulate,
    getPositionTexture,
    getVelocityTexture,
    particleCount,
    fboWidth,
    fboHeight,
    material: simMaterial,
  } = useGPGPU();

  // Theme tracking
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

  // Palette cycling state
  const paletteRef = useRef({
    currentIndex: Math.floor(Math.random() * paletteNames.length),
    nextIndex: Math.floor(Math.random() * paletteNames.length),
    progress: 0,
    lastSwitch: 0,
    interval: 15 + Math.random() * 10,
  });

  // Attractor choreography state
  const choreographyRef = useRef({
    currentKeyframe: 0,
    nextKeyframe: 1,
    progress: 0,
    phase: 'holding' as 'holding' | 'transitioning',
    phaseStart: 0,
    // Slow orbital drift adds organic motion on top of keyframes
    orbitAngle: 0,
  });

  // Create geometry and material
  const { geometry, material } = useMemo(() => {
    const indices = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) indices[i] = i;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    geo.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));

    const initialPalette = palettes[paletteNames[paletteRef.current.currentIndex]];
    const colors = initialPalette.colors;

    const mat = new THREE.ShaderMaterial({
      vertexShader: particlesVert,
      fragmentShader: particlesFrag,
      uniforms: {
        uPositions: { value: null },
        uVelocities: { value: null },
        uFboResolution: { value: new THREE.Vector2(fboWidth, fboHeight) },
        uPointSize: { value: 3.5 },
        uDepthFade: { value: 10.0 },
        uColor1: { value: new THREE.Color(colors[0]) },
        uColor2: { value: new THREE.Color(colors[1]) },
        uColor3: { value: new THREE.Color(colors[2]) },
        uOpacity: { value: 0.07 },
        uIsDark: { value: 1.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    return { geometry: geo, material: mat };
  }, [particleCount, fboWidth, fboHeight]);

  // Update attractor positions based on choreography
  const updateAttractors = (elapsed: number) => {
    const ch = choreographyRef.current;

    if (ch.phase === 'holding') {
      if (elapsed - ch.phaseStart > KEYFRAME_DURATION) {
        ch.phase = 'transitioning';
        ch.phaseStart = elapsed;
        ch.nextKeyframe = (ch.currentKeyframe + 1) % ATTRACTOR_KEYFRAMES.length;
      }
    } else if (ch.phase === 'transitioning') {
      const transProgress = (elapsed - ch.phaseStart) / TRANSITION_DURATION;
      if (transProgress >= 1.0) {
        ch.currentKeyframe = ch.nextKeyframe;
        ch.phase = 'holding';
        ch.phaseStart = elapsed;
        ch.progress = 0;
      } else {
        ch.progress = smoothstep(transProgress);
      }
    }

    // Interpolate attractors between keyframes
    const currentKf = ATTRACTOR_KEYFRAMES[ch.currentKeyframe];
    const nextKf = ATTRACTOR_KEYFRAMES[ch.nextKeyframe];
    const t = ch.phase === 'transitioning' ? ch.progress : 0;

    // Add slow orbital drift for organic motion
    ch.orbitAngle += 0.003;
    const orbitX = Math.cos(ch.orbitAngle) * 0.15;
    const orbitY = Math.sin(ch.orbitAngle * 0.7) * 0.1;
    const orbitZ = Math.sin(ch.orbitAngle * 0.4) * 0.1;

    const attractors = simMaterial.uniforms.uAttractors.value as THREE.Vector4[];
    for (let i = 0; i < 4; i++) {
      const lerped = lerpVec4(currentKf[i], nextKf[i], t);
      attractors[i].set(
        lerped[0] + orbitX * (i % 2 === 0 ? 1 : -1),
        lerped[1] + orbitY * (i < 2 ? 1 : -1),
        lerped[2] + orbitZ,
        lerped[3]
      );
    }
  };

  // Update palette colors
  const updatePalette = (elapsed: number) => {
    const ps = paletteRef.current;
    const isDark = themeRef.current === 'dark';

    if (elapsed - ps.lastSwitch > ps.interval && ps.progress >= 1.0) {
      ps.currentIndex = ps.nextIndex;
      let next = Math.floor(Math.random() * paletteNames.length);
      while (next === ps.currentIndex && paletteNames.length > 1) {
        next = Math.floor(Math.random() * paletteNames.length);
      }
      ps.nextIndex = next;
      ps.progress = 0;
      ps.lastSwitch = elapsed;
      ps.interval = 15 + Math.random() * 10;
    }

    if (ps.progress < 1.0) {
      ps.progress = Math.min(1.0, ps.progress + 0.003);
    }

    const currentColors = palettes[paletteNames[ps.currentIndex]].colors;
    const nextColors = palettes[paletteNames[ps.nextIndex]].colors;
    const t = smoothstep(ps.progress);

    // Lerp 3 colors for the monochromatic gradient
    const c1 = new THREE.Color(currentColors[0]).lerp(new THREE.Color(nextColors[0]), t);
    const c2 = new THREE.Color(currentColors[1]).lerp(new THREE.Color(nextColors[1]), t);
    const c3 = new THREE.Color(currentColors[2]).lerp(new THREE.Color(nextColors[2]), t);

    (material.uniforms.uColor1.value as THREE.Color).copy(c1);
    (material.uniforms.uColor2.value as THREE.Color).copy(c2);
    (material.uniforms.uColor3.value as THREE.Color).copy(c3);

    material.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;
    material.uniforms.uOpacity.value = isDark ? 0.07 : 0.05;
  };

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Update choreography
    updateAttractors(elapsed);
    updatePalette(elapsed);

    // Run simulation
    simulate(delta);

    // Update render material textures
    material.uniforms.uPositions.value = getPositionTexture();
    material.uniforms.uVelocities.value = getVelocityTexture();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
