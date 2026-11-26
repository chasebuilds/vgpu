# Chase Builds hero effects

Six WebGPU backgrounds for small business sites, built on vgpu. Live demo: https://chasebuilds.github.io/vgpu/chasebuilds/effects/

| Effect | Looks like |
|---|---|
| `aurora` | Slow amber and rose bands behind a headline |
| `glass` | Soft blobs that melt together and follow the mouse |
| `embers` | Sparks rising through dark |
| `prism` | A beam split into a rainbow, aimed with the mouse |
| `periwinkle`, `periwinkleNight` | Soft color clouds, the live backdrop on chasebuilds.github.io |

## Use it

```html
<canvas id="hero" style="background:linear-gradient(#7a3b22,#1b1714)"></canvas>
<script type="module">
  import { mountHero } from "./hero.js";
  await mountHero(document.getElementById("hero"), "embers");
</script>
```

No build step: `hero.js` loads vgpu from esm.sh. Browsers without WebGPU keep the canvas's CSS background, so always give it one.
