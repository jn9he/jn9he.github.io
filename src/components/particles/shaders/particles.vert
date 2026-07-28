uniform sampler2D uPositions;
uniform sampler2D uVelocities;
uniform vec2 uFboResolution;
uniform float uPointSize;
uniform float uDepthFade;

attribute float aIndex;

varying float vAlpha;
varying float vDepth;
varying vec2 vParticleUv;

void main() {
  // Compute UV to sample position/velocity textures
  float col = mod(aIndex, uFboResolution.x);
  float row = floor(aIndex / uFboResolution.x);
  vec2 particleUv = vec2((col + 0.5) / uFboResolution.x, (row + 0.5) / uFboResolution.y);
  vParticleUv = particleUv;

  // Read 3D position and velocity from GPGPU textures
  vec4 posData = texture2D(uPositions, particleUv);
  vec4 velData = texture2D(uVelocities, particleUv);

  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;
  float speed = length(vel);

  // Project into view space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation by depth (closer = larger)
  float distFromCamera = -mvPosition.z;
  float sizeAtten = 300.0 / max(distFromCamera, 1.0);

  // Slight size variation by speed (faster = slightly smaller/streakier)
  float speedFactor = 1.0 - smoothstep(0.0, 0.012, speed) * 0.3;

  gl_PointSize = uPointSize * sizeAtten * speedFactor;

  // Alpha: based on depth (atmospheric fade) and speed
  float depthAlpha = smoothstep(uDepthFade, uDepthFade * 0.3, distFromCamera);
  float speedAlpha = 1.0 - smoothstep(0.0, 0.015, speed) * 0.4;

  vAlpha = depthAlpha * speedAlpha;
  vDepth = distFromCamera;
}
