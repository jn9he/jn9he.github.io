import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { SimulationMaterial } from './SimulationMaterial';

const FBO_WIDTH = 64;
const FBO_HEIGHT = 32;
const PARTICLE_COUNT = FBO_WIDTH * FBO_HEIGHT; // 512

/**
 * Creates initial position/velocity data texture.
 * xy = position (0-1), zw = velocity (starts at 0)
 */
function createInitialDataTexture(): THREE.DataTexture {
  const size = FBO_WIDTH * FBO_HEIGHT;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i++) {
    const i4 = i * 4;
    // Random position in 0-1 range (with some padding from edges)
    data[i4 + 0] = 0.1 + Math.random() * 0.8; // x position
    data[i4 + 1] = 0.1 + Math.random() * 0.8; // y position
    data[i4 + 2] = (Math.random() - 0.5) * 0.002; // x velocity
    data[i4 + 3] = (Math.random() - 0.5) * 0.002; // y velocity
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

  const { scene, camera, material, renderTargets, quadMesh } = useMemo(() => {
    // Create two render targets for ping-pong
    const rtOptions: THREE.RenderTargetOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    const rt0 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);
    const rt1 = new THREE.WebGLRenderTarget(FBO_WIDTH, FBO_HEIGHT, rtOptions);

    // Create simulation material
    const simMaterial = new SimulationMaterial();

    // Create a fullscreen quad for the simulation pass
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, simMaterial);
    simScene.add(mesh);

    // Initialize rt0 with initial data
    const initTexture = createInitialDataTexture();
    simMaterial.uniforms.uPositions.value = initTexture;

    // Render initial state to rt0
    const currentRT = gl.getRenderTarget();
    gl.setRenderTarget(rt0);
    gl.render(simScene, simCamera);
    gl.setRenderTarget(currentRT);

    return {
      scene: simScene,
      camera: simCamera,
      material: simMaterial,
      renderTargets: [rt0, rt1],
      quadMesh: mesh,
    };
  }, [gl]);

  const pingPongRef = useRef(0);

  const simulate = (delta: number) => {
    timeRef.current += delta;

    const currentIndex = pingPongRef.current;
    const nextIndex = 1 - currentIndex;

    // Read from current, write to next
    material.uniforms.uPositions.value = renderTargets[currentIndex].texture;
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uDelta.value = Math.min(delta, 0.05); // Cap delta to prevent explosions

    const currentRT = gl.getRenderTarget();
    gl.setRenderTarget(renderTargets[nextIndex]);
    gl.render(scene, camera);
    gl.setRenderTarget(currentRT);

    pingPongRef.current = nextIndex;
  };

  const getPositionTexture = () => {
    return renderTargets[pingPongRef.current].texture;
  };

  return {
    simulate,
    getPositionTexture,
    particleCount: PARTICLE_COUNT,
    fboWidth: FBO_WIDTH,
    fboHeight: FBO_HEIGHT,
    material,
  };
}
