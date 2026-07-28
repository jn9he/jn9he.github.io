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
        uFlowSpeed: { value: 0.4 },
        uNoiseScale: { value: 0.8 },
        uNoiseEvolution: { value: 0.08 },
        uSeparationRadius: { value: 0.05 },
        uCenterGravity: { value: 0.008 },
        uResolution: { value: new THREE.Vector2(32, 16) },
      },
    });
  }
}
