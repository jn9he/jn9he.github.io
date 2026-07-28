precision highp float;

uniform sampler2D uPositions;
uniform sampler2D uVelocities;
uniform float uTime;
uniform float uDelta;
uniform int uPass;

// Attractors: xyz = position, w = strength
uniform vec4 uAttractors[5];
uniform int uAttractorCount;
uniform float uAttractorStrength;
uniform float uAttractorFalloff;

// Curl noise
uniform float uCurlScale;
uniform float uCurlSpeed;
uniform float uCurlStrength;

// Physics
uniform float uDamping;
uniform float uMaxSpeed;

// Containment
uniform float uContainmentRadius;
uniform float uContainmentStrength;

varying vec2 vUv;

// ---- Simplex 3D noise ----
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ---- 3D Curl Noise (divergence-free) ----
vec3 curlNoise(vec3 p) {
  float eps = 0.01;
  vec3 curl;

  // dFz/dy - dFy/dz
  float n1 = snoise(p + vec3(0.0, eps, 0.0));
  float n2 = snoise(p - vec3(0.0, eps, 0.0));
  float n3 = snoise(p + vec3(0.0, 0.0, eps));
  float n4 = snoise(p - vec3(0.0, 0.0, eps));
  curl.x = (n1 - n2 - n3 + n4) / (2.0 * eps);

  // dFx/dz - dFz/dx
  n1 = snoise(p + vec3(0.0, 0.0, eps) + vec3(31.416, 0.0, 0.0));
  n2 = snoise(p - vec3(0.0, 0.0, eps) + vec3(31.416, 0.0, 0.0));
  n3 = snoise(p + vec3(eps, 0.0, 0.0) + vec3(31.416, 0.0, 0.0));
  n4 = snoise(p - vec3(eps, 0.0, 0.0) + vec3(31.416, 0.0, 0.0));
  curl.y = (n1 - n2 - n3 + n4) / (2.0 * eps);

  // dFy/dx - dFx/dy
  n1 = snoise(p + vec3(eps, 0.0, 0.0) + vec3(0.0, 71.628, 0.0));
  n2 = snoise(p - vec3(eps, 0.0, 0.0) + vec3(0.0, 71.628, 0.0));
  n3 = snoise(p + vec3(0.0, eps, 0.0) + vec3(0.0, 71.628, 0.0));
  n4 = snoise(p - vec3(0.0, eps, 0.0) + vec3(0.0, 71.628, 0.0));
  curl.z = (n1 - n2 - n3 + n4) / (2.0 * eps);

  return curl;
}

// ---- Attractor force with gaussian falloff ----
vec3 attractorForce(vec3 pos, vec4 attractor) {
  vec3 toAttractor = attractor.xyz - pos;
  float dist = length(toAttractor);
  if (dist < 0.001) return vec3(0.0);

  // Gaussian falloff: strong near, fades smoothly
  float force = attractor.w * exp(-dist * dist / (uAttractorFalloff * uAttractorFalloff));

  return normalize(toAttractor) * force * uAttractorStrength;
}

// ---- Containment force (soft sphere) ----
vec3 containmentForce(vec3 pos) {
  float dist = length(pos);
  if (dist < uContainmentRadius) return vec3(0.0);

  // Smooth push-back beyond radius
  float overshoot = dist - uContainmentRadius;
  float strength = overshoot * overshoot * uContainmentStrength;
  return -normalize(pos) * strength;
}

void main() {
  vec4 posData = texture2D(uPositions, vUv);
  vec4 velData = texture2D(uVelocities, vUv);

  vec3 pos = posData.xyz;
  float seed = posData.w;
  vec3 vel = velData.xyz;

  if (uPass == 0) {
    // ===== PASS 0: Compute new velocity =====

    // 1. Attractor forces (coherent — all particles feel same field)
    vec3 attForce = vec3(0.0);
    for (int i = 0; i < 5; i++) {
      if (i >= uAttractorCount) break;
      attForce += attractorForce(pos, uAttractors[i]);
    }

    // 2. Curl noise (coherent — position-based, NO per-particle time offset)
    float timeEvolution = uTime * uCurlSpeed;
    vec3 noisePos = pos * uCurlScale + vec3(timeEvolution * 0.3, timeEvolution * 0.2, timeEvolution * 0.1);
    vec3 curlForce = curlNoise(noisePos) * uCurlStrength;

    // Second octave: finer detail, weaker
    vec3 noisePos2 = pos * uCurlScale * 2.3 + vec3(timeEvolution * 0.5 + 47.0, timeEvolution * 0.3, timeEvolution * 0.2 + 31.0);
    curlForce += curlNoise(noisePos2) * uCurlStrength * 0.3;

    // 3. Containment
    vec3 contain = containmentForce(pos);

    // 4. Combine forces
    vec3 acceleration = attForce + curlForce + contain;

    // 5. Update velocity with damping
    vel = vel * uDamping + acceleration * uDelta;

    // 6. Clamp speed
    float speed = length(vel);
    if (speed > uMaxSpeed) {
      vel = vel / speed * uMaxSpeed;
    }

    gl_FragColor = vec4(vel, 0.0);

  } else {
    // ===== PASS 1: Integrate position =====
    pos += vel * uDelta * 60.0; // normalize for 60fps

    // Soft respawn: if particle drifts way too far, gently reset
    if (length(pos) > uContainmentRadius * 2.0) {
      pos *= 0.5;
    }

    gl_FragColor = vec4(pos, seed);
  }
}
