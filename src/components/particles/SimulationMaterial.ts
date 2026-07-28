import * as THREE from 'three';

import simulationVert from './shaders/simulation.vert?raw';
import simulationFrag from './shaders/simulation.frag?raw';

/**
 * Simulation material for the volumetric organism.
 * Two-pass system: pass 0 = velocity update, pass 1 = position integration.
 * 
 * Attractors are vec4: xyz = position, w = strength
 */
export class SimulationMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: simulationVert,
      fragmentShader: simulationFrag,
      uniforms: {
        // Textures
        uPositions: { value: null },
        uVelocities: { value: null },

        // Time
        uTime: { value: 0 },
        uDelta: { value: 0.016 },

        // Pass selector: 0 = velocity update, 1 = position integration
        uPass: { value: 0 },

        // Attractors (up to 5)
        uAttractors: {
          value: [
            new THREE.Vector4(0, 0, 0, 1),
            new THREE.Vector4(0, 0, 0, 1),
            new THREE.Vector4(0, 0, 0, 1),
            new THREE.Vector4(0, 0, 0, 1),
            new THREE.Vector4(0, 0, 0, 1),
          ],
        },
        uAttractorCount: { value: 4 },
        uAttractorStrength: { value: 0.025 },
        uAttractorFalloff: { value: 2.0 },

        // Curl noise flow
        uCurlScale: { value: 0.8 },
        uCurlSpeed: { value: 0.15 },
        uCurlStrength: { value: 0.3 },

        // Physics
        uDamping: { value: 0.97 },
        uMaxSpeed: { value: 0.015 },

        // Containment
        uContainmentRadius: { value: 3.2 },
        uContainmentStrength: { value: 0.008 },
      },
    });
  }
}
