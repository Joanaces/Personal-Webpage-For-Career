/* Shared helpers: timing, easing, tweening, reduced-motion flag. */
window.ZW = window.ZW || {};
(function (ZW) {
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  const ease = {
    linear: t => t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inQuad: t => t * t,
  };

  ZW.util = {
    ease,
    get reduced() { return mq.matches; },
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    wait: ms => new Promise(r => setTimeout(r, ZW.util.reduced ? Math.min(ms, 120) : ms)),
    /* Run fn(t, rawT) every frame for dur ms; resolves when finished. */
    tween(dur, fn, easing) {
      if (ZW.util.reduced) dur = 0;
      const e = easing || ease.linear;
      return new Promise(res => {
        if (dur <= 0) { fn(1, 1); res(); return; }
        const t0 = performance.now();
        (function step(now) {
          const raw = Math.min(1, (now - t0) / dur);
          fn(e(raw), raw);
          if (raw < 1) requestAnimationFrame(step); else res();
        })(t0);
      });
    },
    nextFrame: () => new Promise(r => requestAnimationFrame(() => r())),
  };
})(window.ZW);
