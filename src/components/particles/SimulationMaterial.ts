import * as THREE from 'three';

import simulationVert from './shaders/simulation.vert?raw';
import simulationFrag from './shaders/simulation.frag?raw';

export class SimulationMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: simulationVert,
      fragmentShader: simulationFrag,
      uniforms: {
        uPositions: { value: null },
        uTime: { value: 0 },
        uDelta: { value: 0.016 },
        uFlowSpeed: { value: 0.35 },
        uNoiseScale: { value: 1.2 },
        uNoiseEvolution: { value: 0.06 },
        uSeparationRadius: { value: 0.05 },
        uCenterGravity: { value: 0.002 },
        uResolution: { value: new THREE.Vector2(32, 16) },
        uStructures: { value: new Array(8).fill(new THREE.Vector4(0, 0, 0, 0)) },
        uStructureCount: { value: 0 },
      },
    });
  }
}
