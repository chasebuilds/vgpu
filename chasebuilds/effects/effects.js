// Chase Builds hero effects for vgpu. Each one is a fullscreen fragment shader.
// Bindings: params.res (canvas size in px), params.time (seconds), params.mouse (0..1).
const HEAD = /* wgsl */ `
struct Params { res: vec2f, mouse: vec2f, time: f32 }
@group(0) @binding(0) var<uniform> params: Params;
fn hash(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn noise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2f(1, 0)), u.x), mix(hash(i + vec2f(0, 1)), hash(i + vec2f(1, 1)), u.x), u.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0; var a = 0.5; var s = 0.0;
  for (var i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2f(1.7, 9.2); a *= 0.5; }
  return s;
}
fn aspectUv(uv: vec2f) -> vec2f { return vec2f((uv.x - 0.5) * params.res.x / params.res.y, uv.y - 0.5); }
`;

export const EFFECTS = {
  aurora: {
    name: "Warm aurora",
    blurb: "Slow amber and rose bands drifting behind your headline.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv); let t = params.time * 0.08;
  let n = fbm(vec2f(p.x * 1.6 + t, p.y * 3.0 - t * 0.6) + fbm(p * 2.0 + t));
  let band = smoothstep(0.35, 0.75, n) * (1.0 - smoothstep(-0.1, 0.5, abs(p.y + 0.1 - 0.25 * sin(p.x * 2.0 + t * 3.0))));
  let base = mix(vec3f(0.10, 0.07, 0.06), vec3f(0.18, 0.11, 0.09), uv.y);
  let col = base + band * mix(vec3f(0.95, 0.55, 0.25), vec3f(0.85, 0.35, 0.45), n);
  return vec4f(col, 1.0);
}`,
  },
  glass: {
    name: "Liquid glass",
    blurb: "Soft blobs that melt together and follow the mouse.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv); let t = params.time * 0.4;
  let m = aspectUv(params.mouse);
  var f = 0.0;
  for (var i = 0; i < 6; i++) {
    let fi = f32(i);
    let c = vec2f(sin(t * (0.5 + fi * 0.13) + fi * 2.1) * 0.55, cos(t * (0.4 + fi * 0.11) + fi) * 0.3);
    f += 0.011 / dot(p - c, p - c);
  }
  f += 0.016 / dot(p - m, p - m);
  let edge = smoothstep(0.9, 1.1, f);
  let rim = smoothstep(0.9, 1.0, f) - smoothstep(1.0, 1.3, f);
  let bg = mix(vec3f(0.12, 0.09, 0.08), vec3f(0.22, 0.14, 0.11), uv.y);
  let glass = mix(vec3f(1.0, 0.78, 0.55), vec3f(0.95, 0.60, 0.50), uv.x);
  return vec4f(mix(bg, glass * 0.75, edge * 0.55) + rim * 0.4, 1.0);
}`,
  },
  embers: {
    name: "Embers",
    blurb: "Sparks rising through dark, like a forge or a campfire.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv); var col = vec3f(0.05, 0.03, 0.03) + vec3f(0.25, 0.08, 0.02) * (1.0 - uv.y) * (1.0 - uv.y);
  for (var l = 0; l < 3; l++) {
    let s = 8.0 + f32(l) * 6.0;
    var q = p * s; q.y -= params.time * (0.6 + f32(l) * 0.3) * 2.0; q.x += sin(q.y * 0.3 + f32(l)) * 0.6;
    let id = floor(q); let g = fract(q) - 0.5;
    let h = hash(id + f32(l) * 7.0);
    let o = vec2f(hash(id + 3.1) - 0.5, hash(id + 5.7) - 0.5) * 0.6;
    let d = length(g - o);
    let spark = step(0.75, h) * smoothstep(0.08, 0.0, d) * (0.6 + 0.4 * sin(params.time * 6.0 + h * 40.0));
    col += spark * mix(vec3f(1.0, 0.45, 0.1), vec3f(1.0, 0.85, 0.5), h) * (1.2 - f32(l) * 0.3);
  }
  return vec4f(col, 1.0);
}`,
  },
  prism: {
    name: "Prism light",
    blurb: "A beam that splits into a soft rainbow, aimed with the mouse.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv);
  let ang = (params.mouse.y - 0.5) * 0.6 + 0.08 * sin(params.time * 0.5);
  var col = vec3f(0.04, 0.035, 0.04);
  let beamIn = smoothstep(0.012, 0.0, abs(p.y - ang * 0.0)) * step(p.x, 0.0);
  col += beamIn * vec3f(1.0);
  for (var i = 0; i < 7; i++) {
    let k = f32(i) / 6.0;
    let slope = ang + (k - 0.5) * 0.35;
    let d = abs(p.y - p.x * slope);
    let hue = vec3f(0.5 + 0.5 * cos(6.2831 * (k + vec3f(0.0, 0.33, 0.67))));
    col += step(0.0, p.x) * hue * smoothstep(0.03 + p.x * 0.05, 0.0, d) * 0.55;
  }
  let tri = max(abs(p.x) * 0.866 + p.y * 0.5, -p.y) - 0.12;
  col = mix(col, vec3f(0.6, 0.6, 0.65) * 0.25 + col * 0.5, smoothstep(0.005, 0.0, tri));
  col += vec3f(0.9) * smoothstep(0.006, 0.0, abs(tri));
  return vec4f(col, 1.0);
}`,
  },
  periwinkle: {
    name: "Periwinkle day",
    blurb: "Soft drifting color clouds for frosted glass pages, the chasebuilds.github.io backdrop.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv); let t = params.time * 0.05;
  let w = vec2f(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 4.0)) - 0.5;
  let q = p + w * 0.5 + (params.mouse - 0.5) * 0.06;
  var col = mix(vec3f(0.706, 0.737, 0.902), vec3f(0.827, 0.843, 0.953), uv.y);
  col = mix(col, vec3f(0.933, 0.941, 1.000), smoothstep(0.7, 0.0, length(vec2f(p.x * 0.8, p.y - 0.5))) * 0.8);
  col = mix(col, vec3f(0.788, 0.722, 0.925), smoothstep(0.55, 0.0, length(q - vec2f(-0.6 + 0.1 * sin(t * 3.0), 0.15))) * 0.75);
  col = mix(col, vec3f(0.663, 0.776, 0.933), smoothstep(0.6, 0.0, length(q - vec2f(0.65, -0.05 + 0.1 * cos(t * 2.0)))) * 0.75);
  col = mix(col, vec3f(0.725, 0.851, 0.812), smoothstep(0.5, 0.0, length(q - vec2f(0.1 * sin(t * 2.5), -0.55))) * 0.5);
  col += (hash(uv * params.res) - 0.5) / 255.0;
  return vec4f(col, 1.0);
}`,
  },
  periwinkleNight: {
    name: "Periwinkle night",
    blurb: "Soft drifting color clouds for frosted glass pages, the chasebuilds.github.io backdrop.",
    wgsl: HEAD + /* wgsl */ `
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = aspectUv(uv); let t = params.time * 0.05;
  let w = vec2f(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 4.0)) - 0.5;
  let q = p + w * 0.5 + (params.mouse - 0.5) * 0.06;
  var col = mix(vec3f(0.106, 0.125, 0.251), vec3f(0.165, 0.188, 0.376), uv.y);
  col = mix(col, vec3f(0.243, 0.275, 0.565), smoothstep(0.7, 0.0, length(vec2f(p.x * 0.8, p.y - 0.5))) * 0.8);
  col = mix(col, vec3f(0.231, 0.184, 0.416), smoothstep(0.55, 0.0, length(q - vec2f(-0.6 + 0.1 * sin(t * 3.0), 0.15))) * 0.75);
  col = mix(col, vec3f(0.141, 0.255, 0.431), smoothstep(0.6, 0.0, length(q - vec2f(0.65, -0.05 + 0.1 * cos(t * 2.0)))) * 0.75);
  col = mix(col, vec3f(0.122, 0.290, 0.275), smoothstep(0.5, 0.0, length(q - vec2f(0.1 * sin(t * 2.5), -0.55))) * 0.5);
  col += (hash(uv * params.res) - 0.5) / 255.0;
  return vec4f(col, 1.0);
}`,
  },
};
