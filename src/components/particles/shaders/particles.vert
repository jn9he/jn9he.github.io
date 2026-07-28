uniform sampler2D uPositions;
uniform vec2 uResolution;
uniform float uPointSize;
uniform float uAspect;

attribute float aIndex;

varying vec2 vParticleUv;
varying float vSpeed;

void main() {
  // Compute UV coordinates for this particle in the FBO texture
  float texWidth = uResolution.x;
  float texHeight = uResolution.y;
  float col = mod(aIndex, texWidth);
  float row = floor(aIndex / texWidth);
  vec2 particleUv = vec2(
    (col + 0.5) / texWidth,
    (row + 0.5) / texHeight
  );

  vParticleUv = particleUv;

  // Read position and velocity from FBO
  vec4 posData = texture2D(uPositions, particleUv);
  vec2 pos = posData.xy;
  vec2 vel = posData.zw;

  vSpeed = length(vel);

  // Convert from 0-1 to clip space (-1 to 1), correcting aspect ratio
  vec3 worldPos = vec3(
    (pos.x - 0.5) * 2.0 * uAspect,
    (pos.y - 0.5) * 2.0,
    0.0
  );

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size varies with velocity — faster particles are slightly larger
  float sizeVariation = 1.0 + vSpeed * 20.0;
  gl_PointSize = uPointSize * sizeVariation * (1.0 / -mvPosition.z);
}
