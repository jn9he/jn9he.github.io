uniform sampler2D uPositions;
uniform vec2 uResolution;
uniform float uPointSize;
uniform float uAspect;
attribute float aIndex;
varying vec2 vParticleUv;
varying float vSpeed;

void main() {
  float texWidth = uResolution.x;
  float texHeight = uResolution.y;
  float col = mod(aIndex, texWidth);
  float row = floor(aIndex / texWidth);
  vec2 particleUv = vec2((col + 0.5) / texWidth, (row + 0.5) / texHeight);
  vParticleUv = particleUv;

  vec4 posData = texture2D(uPositions, particleUv);
  vec2 pos = posData.xy;
  vec2 vel = posData.zw;
  vSpeed = length(vel);

  float frustumHalfHeight = 2.887;
  vec3 worldPos = vec3(
    (pos.x - 0.5) * 2.0 * frustumHalfHeight * uAspect,
    (pos.y - 0.5) * 2.0 * frustumHalfHeight,
    0.0
  );

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float sizeVariation = 1.0 + vSpeed * 5.0;
  gl_PointSize = uPointSize * sizeVariation * (1.0 / -mvPosition.z);
}
