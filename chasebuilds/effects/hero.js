// Mount a Chase Builds effect on a <canvas>. Falls back to the canvas's CSS background when WebGPU is missing.
import { clock, effect, frameLoop, init, surface } from "https://esm.sh/vgpu@0.6.0";
import { prepareShader } from "https://esm.sh/@vgpu/wgsl@0.6.0/prepare";
import { EFFECTS } from "./effects.js";

export async function mountHero(canvas, name = "aurora") {
  if (!navigator.gpu) return null;
  const gpu = await init();
  const surf = surface(gpu, canvas, { dpr: [1, matchMedia("(pointer: coarse)").matches ? 1 : 2] });
  const mouse = [0.5, 0.5];
  // Window-level so the pointer still steers the effect when text or panels sit on top; works for touch drags too.
  const track = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse[0] = (e.clientX - r.left) / r.width;
    mouse[1] = 1 - (e.clientY - r.top) / r.height;
  };
  addEventListener("pointermove", track, { passive: true });
  addEventListener("pointerdown", track, { passive: true });
  const cache = {};
  const make = (n) => (cache[n] ??= effect(gpu, prepareShader(EFFECTS[n].wgsl), { set: { params: { res: surf.size, mouse, time: 0 } } }));
  let fx = make(name);
  surf.onResize(() => fx.set({ params: { res: surf.size } }));
  const time = clock(gpu);
  // Draw only while the canvas is on screen: scrolling past it on a phone then costs nothing.
  let loop = null;
  const run = (on) => {
    if (on && !loop) loop = frameLoop(gpu, (frame) => { fx.set({ params: { time: time.time, mouse, res: surf.size } }); frame.pass(surf, fx); });
    if (!on && loop) { loop.stop(); loop = null; }
  };
  let seen = true;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(seen && !document.hidden); }).observe(canvas);
  document.addEventListener("visibilitychange", () => run(seen && !document.hidden));
  run(true);
  return { use: (n) => { fx = make(n); }, gpu };
}
