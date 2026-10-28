/*
 * Viewport geometry. Single source of truth for scale and anchor positions.
 * Everything is derived from the viewport; CSS variables are published for the stylesheet.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const SRC = { W: 1200, H: 675, margin: 14, taskbarTop: 638 }; // background source size, camera safety margin
  const SPR = { cell: 256, feetY: 200, centerX: 132, headY: 48, chestY: 128 }; // character sheet (sprite px)
  const FOLDER = { w: 28, h: 24 };   // native art size of the supplied folder
  const SPEAKER = { w: 26, h: 21 };  // native art size of the supplied speaker
  const L = { SRC, SPR, FOLDER, SPEAKER };
  const listeners = [];

  function compute() {
    const de = document.documentElement;
    const vw = de.clientWidth || innerWidth, vh = de.clientHeight || innerHeight;
    L.vw = vw; L.vh = vh;

    // Background: cover the viewport using the image minus a camera safety margin; bottom-anchored so the
    // taskbar always sits on the bottom edge.
    const S = Math.max(vw / (SRC.W - 2 * SRC.margin), vh / (SRC.H - SRC.margin));
    L.S = S;
    L.bgLeft = (vw - SRC.W * S) / 2;
    L.bgTop = vh - SRC.H * S;
    L.tbH = (SRC.H - SRC.taskbarTop) * S;

    // Character: ~15% of viewport height, whole-pixel art scale (1 art pixel = 8 sprite pixels).
    const apH = Math.round((vh * 0.15) / 19);
    const apW = Math.round((vw * 0.30) / 13);
    L.ap = Math.max(3, Math.min(apH, apW));
    L.cs = L.ap / 8;                       // sprite px -> screen px
    L.cell = SPR.cell * L.cs;
    L.feetY = vh * 0.75;                   // brief: feet at 75% of viewport height
    L.heroY = L.feetY - SPR.feetY * L.cs;
    L.heroFinalX = vw / 2 - SPR.centerX * L.cs;
    L.heroStartX = -(184 * L.cs) - 8;      // fully off the left edge (sprite content ends at x=184)
    L.headTopY = L.heroY + SPR.headY * L.cs;
    L.chest = { x: 0, y: L.heroY + SPR.chestY * L.cs };

    // Other pixel scales follow the character so everything shares one pixel density.
    L.u = L.ap;                                       // speech bubble / menu unit
    L.fp = Math.max(2, Math.round(L.ap * 0.62));      // folder art pixel
    L.sp = Math.max(2, Math.round((L.tbH * 0.8) / SPEAKER.h)); // speaker art pixel (fits the tray)
    L.b = Math.max(3, Math.round(L.ap * 0.5));            // menu border thickness
    L.cp = Math.max(3, Math.round(L.ap * 0.55));          // menu cursor art pixel
    L.font = Math.round(ZW.util.clamp(vh * 0.027, 16, 34));
    L.folderPos = { x: vw / 2, y: vh * 0.31 };       // folder resting centre

    const set = (k, v) => de.style.setProperty(k, v);
    set('--S', S); set('--bg-left', L.bgLeft + 'px'); set('--bg-top', L.bgTop + 'px');
    set('--bg-w', SRC.W * S + 'px'); set('--bg-h', SRC.H * S + 'px');
    set('--tbh', L.tbH + 'px'); set('--tb-top', (vh - L.tbH) + 'px');
    set('--ap', L.ap + 'px'); set('--cs', L.cs); set('--u', L.u + 'px'); set('--fp', L.fp + 'px'); set('--sp', L.sp + 'px');
    set('--font', L.font + 'px'); set('--b', L.b + 'px'); set('--cp', L.cp + 'px'); set('--vw', vw + 'px'); set('--vh', vh + 'px');
  }

  let raf = 0;
  function onResize() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { compute(); listeners.forEach(fn => fn(L)); });
  }

  L.init = function () { compute(); window.addEventListener('resize', onResize); window.addEventListener('orientationchange', onResize); };
  L.onChange = fn => listeners.push(fn);
  L.recompute = compute;
  ZW.layout = L;
})(window.ZW);
