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
  // Very soft gaussian-like falloff for paint/fluid look
  float alpha = exp(-dist * dist * 8.0);

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

  // Velocity-based color shift (faster = slightly brighter, creates depth)
  color *= 1.0 + vSpeed * 5.0;

  if (uIsDark < 0.5) {
    color *= 0.7;
    gl_FragColor = vec4(color, alpha * uOpacity);
  } else {
    // Additive premultiplied for glowing fluid look
    gl_FragColor = vec4(color * alpha * uOpacity, alpha * uOpacity * 0.8);
  }
}
