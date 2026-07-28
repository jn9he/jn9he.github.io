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
        uFlowSpeed: { value: 0.6 },
        uNoiseScale: { value: 0.6 },
        uNoiseEvolution: { value: 0.03 },
        uSeparationRadius: { value: 0.05 },
        uCenterGravity: { value: 0.006 },
        uResolution: { value: new THREE.Vector2(64, 32) },
        uStructures: { value: new Array(8).fill(new THREE.Vector4(0, 0, 0, 0)) },
        uStructureCount: { value: 0 },
      },
    });
  }
}
