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

  // Ultra-soft falloff for a paint/watercolor blob look
  // Much wider than before — particles blend into each other like fluid
  float alpha = smoothstep(0.5, 0.0, dist);
  alpha = alpha * alpha; // Extra softness at edges

  if (alpha < 0.005) discard;

  // Color selection based on particle UV coordinates
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

  // Subtle velocity brightness boost
  color *= 1.0 + vSpeed * 3.0;

  if (uIsDark < 0.5) {
    // Light mode: richer, slightly darkened colors with normal blending
    color *= 0.85;
    gl_FragColor = vec4(color, alpha * uOpacity);
  } else {
    // Dark mode: glowing additive premultiplied for luminous fluid effect
    gl_FragColor = vec4(color * alpha * uOpacity, alpha * uOpacity * 0.6);
  }
}
