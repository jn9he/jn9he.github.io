uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uOpacity;
uniform float uIsDark;

varying vec2 vParticleUv;
varying float vSpeed;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  float alpha = 1.0 - smoothstep(0.1, 0.48, dist);

  if (alpha < 0.01) discard;

  float colorIndex = fract(vParticleUv.x * 3.7 + vParticleUv.y * 2.3);

  vec3 color;
  if (colorIndex < 0.2) {
    color = mix(uColor1, uColor2, colorIndex * 5.0);
  } else if (colorIndex < 0.4) {
    color = mix(uColor2, uColor3, (colorIndex - 0.2) * 5.0);
  } else if (colorIndex < 0.6) {
    color = mix(uColor3, uColor4, (colorIndex - 0.4) * 5.0);
  } else if (colorIndex < 0.8) {
    color = mix(uColor4, uColor5, (colorIndex - 0.6) * 5.0);
  } else {
    color = mix(uColor5, uColor1, (colorIndex - 0.8) * 5.0);
  }

  float coreGlow = 1.0 + (1.0 - dist * 2.0) * 0.12;
  color *= coreGlow;

  if (uIsDark < 0.5) {
    color *= 0.6;
    gl_FragColor = vec4(color, alpha * uOpacity);
  } else {
    color *= 1.4;
    gl_FragColor = vec4(color * alpha * uOpacity, alpha * uOpacity);
  }
}
