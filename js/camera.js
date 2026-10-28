/*
 * Camera + sky.
 *  - Ambient:     very slow, organic cloud drift (sums of slow sines, different per layer).
 *  - Interactive: mouse/touch parallax with spring inertia and a faint idle sway.
 *  - Narrative:   story.js lowers `gain` during scripted moments; it eases back smoothly afterwards.
 * All offsets are rounded to whole screen pixels so the pixel art is never resampled by sub-pixel moves.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const TAU = Math.PI * 2;
  // px/py: parallax range in *source* pixels (sky moves most, hill barely). drift: ambient amplitude/period (s).
  const LAYERS = [
    { id: 'L-base', px: 4,   py: 2,   drift: null },
    { id: 'L-far',  px: 6,   py: 3,   drift: { ax: 2.6, ay: 0.7, p1: 53, p2: 31, ph: 0.4 } },
    { id: 'L-near', px: 7.5, py: 3.5, drift: { ax: 3.6, ay: 0.9, p1: 41, p2: 23, ph: 1.9 } },
    { id: 'L-hill', px: 1.4, py: 0.6, drift: null },
  ];

  const cam = {
    x: 0, y: 0, vx: 0, vy: 0,        // spring state (-1..1)
    tx: 0, ty: 0,                    // target from pointer
    gain: 1, gainTarget: 1,          // narrative damping of the mouse response
    running: false,
    layers: [],
  };

  function init() {
    cam.layers = LAYERS.map(l => Object.assign({ el: document.getElementById(l.id), last: '' }, l));
    placeLayers();
    ZW.layout.onChange(placeLayers);

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('pointerleave', () => { cam.tx = 0; cam.ty = 0; });
    document.addEventListener('mouseleave', () => { cam.tx = 0; cam.ty = 0; });
    window.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') { cam.tx = 0; cam.ty = 0; } });

    cam.running = true;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      step(dt, now / 1000);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function placeLayers() {
    const L = ZW.layout;
    const world = document.getElementById('world');
    world.querySelectorAll('.layer').forEach(el => {
      el.style.left = L.bgLeft + 'px'; el.style.top = L.bgTop + 'px';
      el.style.width = L.SRC.W * L.S + 'px'; el.style.height = L.SRC.H * L.S + 'px';
    });
    const tb = document.getElementById('L-taskbar');
    tb.style.left = L.bgLeft + 'px'; tb.style.width = L.SRC.W * L.S + 'px'; tb.style.height = L.tbH + 'px';
  }

  function onPointer(e) {
    const L = ZW.layout;
    cam.tx = ZW.util.clamp((e.clientX / L.vw - 0.5) * 2, -1, 1);
    cam.ty = ZW.util.clamp((e.clientY / L.vh - 0.5) * 2, -1, 1);
  }

  function step(dt, t) {
    const reduced = ZW.util.reduced;
    // Ease the narrative gain (restores normal responsiveness smoothly).
    cam.gain += (cam.gainTarget - cam.gain) * Math.min(1, dt * 1.6);

    // Spring toward the target: a little weight, soft settling, no overshoot to speak of.
    const k = 14, c = 2 * Math.sqrt(k) * 1.05;
    const sway = reduced ? 0 : 1;
    const gx = (reduced ? 0 : cam.tx * cam.gain) + sway * 0.07 * Math.sin(t * TAU / 17);
    const gy = (reduced ? 0 : cam.ty * cam.gain) + sway * 0.05 * Math.sin(t * TAU / 23 + 1.3);
    cam.vx += (k * (gx - cam.x) - c * cam.vx) * dt; cam.x += cam.vx * dt;
    cam.vy += (k * (gy - cam.y) - c * cam.vy) * dt; cam.y += cam.vy * dt;

    const S = ZW.layout.S;
    for (const l of cam.layers) {
      let dx = -cam.x * l.px, dy = -cam.y * l.py;
      if (l.drift && !reduced) {
        const d = l.drift;
        dx += d.ax * Math.sin(t * TAU / d.p1 + d.ph) + 0.35 * d.ax * Math.sin(t * TAU / d.p2);
        dy += d.ay * Math.sin(t * TAU / d.p2 + d.ph * 2);
      }
      const sx = Math.round(dx * S), sy = Math.round(dy * S);
      const v = sx + ',' + sy;
      if (v !== l.last) { l.last = v; l.el.style.transform = 'translate3d(' + sx + 'px,' + sy + 'px,0)'; }
    }
  }

  ZW.camera = {
    init,
    /* Narrative control: 0 = camera ignores the mouse, 1 = full response. */
    setGain(g) { cam.gainTarget = g; },
  };
})(window.ZW);
