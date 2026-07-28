import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { SimulationMaterial } from './SimulationMaterial';

const FBO_WIDTH = 128;
const FBO_HEIGHT = 128;
const PARTICLE_COUNT = FBO_WIDTH * FBO_HEIGHT; // 16384

/**
 * Creates initial position data texture.
 * xyz = position in 3D space, w = life/seed value
 * Particles spawn clustered near center with gaussian-ish distribution
 */
function createPositionTexture(): THREE.DataTexture {
  const size = FBO_WIDTH * FBO_HEIGHT;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i++) {
    const i4 = i * 4;
    // Gaussian-ish distribution centered at origin
    // Box-Muller transform for clustered spawn
    const u1 = Math.random();
    const u2 = Math.random();
    const u3 = Math.random();
    const u4 = Math.random();
    const r1 = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
    const r2 = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.sin(2 * Math.PI * u2);
    const r3 = Math.sqrt(-2 * Math.log(Math.max(u3, 0.0001))) * Math.cos(2 * Math.PI * u4);

    data[i4 + 0] = r1 * 1.2; // x position (spread ~1.2 units)
    data[i4 + 1] = r2 * 1.2; // y position
    data[i4 + 2] = r3 * 0.8; // z position (shallower depth)
    data[i4 + 3] = Math.random(); // seed/life value (used for per-particle variation)
  }

  const texture = new THREE.DataTexture(
    data,
    FBO_WIDTH,
    FBO_HEIGHT,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates initial velocity data texture.
 * xyz = velocity, w = unused (reserved)
 */
function createVelocityTexture(): THREE.DataTexture {
  const size = FBO_WIDTH * FBO_HEIGHT;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i++) {
    const i4 = i * 4;
    data[i4 + 0] = (Math.random() - 0.5) * 0.001;
    data[i4 + 1] = (Math.random() - 0.5) * 0.001;
    data[i4 + 2] = (Math.random() - 0.5) * 0.001;
    data[i4 + 3] = 0.0;
  }

  const texture = new THREE.DataTexture(
    data,
    FBO_WIDTH,
    FBO_HEIGHT,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}

export function useGPGPU() {
  const { gl } = useThree();
  const timeRef = useRef(0);

  const { scene, camera, material, posTargets, velTargets } = useMemo(() => {
    const rtOptions: THREE.RenderTargetOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    // Ping-pong targets for position and velocity
    const posRT0 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);
    const posRT1 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);
    const velRT0 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);
    const velRT1 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);

    // Create simulation material
    const simMaterial = new SimulationMaterial();

    // Fullscreen quad scene
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, simMaterial);
    simScene.add(mesh);

    // Initialize position RT0
    const initPosTex = createPositionTexture();
    const initVelTex = createVelocityTexture();

    // Render initial position state
    simMaterial.uniforms.uPositions.value = initPosTex;
    simMaterial.uniforms.uVelocities.value = initVelTex;
    simMaterial.uniforms.uPass.value = 0; // position pass

    const currentRT = gl.getRenderTarget();

    gl.setRenderTarget(posRT0);
    gl.render(simScene, simCamera);

    // Render initial velocity state
    simMaterial.uniforms.uPass.value = 1; // velocity pass
    gl.setRenderTarget(velRT0);
    gl.render(simScene, simCamera);

    gl.setRenderTarget(currentRT);

    return {
      scene: simScene,
      camera: simCamera,
      material: simMaterial,
      posTargets: [posRT0, posRT1],
      velTargets: [velRT0, velRT1],
    };
  }, [gl]);

  const pingPongRef = useRef(0);

  const simulate = (delta: number) => {
    timeRef.current += delta;
    const clampedDelta = Math.min(delta, 0.05);

    const currentIndex = pingPongRef.current;
    const nextIndex = 1 - currentIndex;

    // Set shared uniforms
    material.uniforms.uPositions.value = posTargets[currentIndex].texture;
    material.uniforms.uVelocities.value = velTargets[currentIndex].texture;
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uDelta.value = clampedDelta;

    const currentRT = gl.getRenderTarget();

    // Pass 0: compute new velocities
    material.uniforms.uPass.value = 0;
    gl.setRenderTarget(velTargets[nextIndex]);
    gl.render(scene, camera);

    // Pass 1: integrate positions using new velocities
    material.uniforms.uVelocities.value = velTargets[nextIndex].texture;
    material.uniforms.uPass.value = 1;
    gl.setRenderTarget(posTargets[nextIndex]);
    gl.render(scene, camera);

    gl.setRenderTarget(currentRT);
    pingPongRef.current = nextIndex;
  };

  const getPositionTexture = () => {
    return posTargets[pingPongRef.current].texture;
  };

  const getVelocityTexture = () => {
    return velTargets[pingPongRef.current].texture;
  };

  return {
    simulate,
    getPositionTexture,
    getVelocityTexture,
    particleCount: PARTICLE_COUNT,
    fboWidth: FBO_WIDTH,
    fboHeight: FBO_HEIGHT,
    material,
  };
}
