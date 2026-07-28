uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uOpacity;
uniform float uIsDark;

varying float vAlpha;
varying float vDepth;
varying vec2 vParticleUv;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft gaussian falloff — particles merge into continuous volume
  float alpha = exp(-dist * dist * 10.0);

  if (alpha < 0.01) discard;

  // Color: gradient based on particle UV for subtle variation
  // Creates luminance depth within the monochromatic palette
  float colorMix = fract(vParticleUv.x * 5.3 + vParticleUv.y * 3.7);

  vec3 color;
  if (colorMix < 0.5) {
    color = mix(uColor1, uColor2, colorMix * 2.0);
  } else {
    color = mix(uColor2, uColor3, (colorMix - 0.5) * 2.0);
  }

  // Depth-based desaturation for atmospheric perspective
  float depthDesaturate = smoothstep(3.0, 8.0, vDepth);
  vec3 fogColor = uIsDark > 0.5 ? vec3(0.02, 0.02, 0.04) : vec3(0.96, 0.96, 0.94);
  color = mix(color, fogColor, depthDesaturate * 0.5);

  // Final alpha: very low per-particle, accumulates through density
  float finalAlpha = alpha * vAlpha * uOpacity;

  if (uIsDark > 0.5) {
    // Dark mode: additive premultiplied for luminous accumulation
    gl_FragColor = vec4(color * finalAlpha, finalAlpha);
  } else {
    // Light mode: standard alpha for softer look
    gl_FragColor = vec4(color, finalAlpha);
  }
}
