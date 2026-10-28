/*
 * Objects the character produces: the portfolio folder and the speaker icon.
 * Both use the supplied artwork. Flights are parametric arcs (never CSS transitions) so that nothing else
 * can fight over their transform.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const U = ZW.util;
  let folderEl, folderImg, speakerEl, speakerFly;
  let folderSettled = false, folderBob = 0;

  function folderSize() { const L = ZW.layout; return { w: L.FOLDER.w * L.fp, h: L.FOLDER.h * L.fp }; }
  function setFolder(cx, cy, rot, scale) {
    const s = folderSize();
    folderEl.style.transform = 'translate3d(' + Math.round(cx - s.w / 2) + 'px,' + Math.round(cy - s.h / 2) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
  }
  function layoutFolder() {
    const L = ZW.layout, s = folderSize();
    folderEl.style.width = s.w + 'px'; folderEl.style.height = s.h + 'px';
    if (folderSettled) setFolder(L.folderPos.x, L.folderPos.y + folderBob, 0, 1);
  }
  function layoutSpeaker() {
    const L = ZW.layout;
    const w = L.SPEAKER.w * L.sp, h = L.SPEAKER.h * L.sp;
    const bw = Math.max(48, w + 20), bh = Math.max(48, Math.round(L.tbH));
    speakerEl.style.width = bw + 'px'; speakerEl.style.height = bh + 'px';
    speakerEl.style.right = Math.max(6, Math.round(L.tbH * 0.16)) + 'px';
    speakerEl.style.bottom = '0px';                                     // always fully inside the viewport
    const img = speakerEl.querySelector('.sp-img');
    img.style.width = w + 'px'; img.style.height = h + 'px';
  }

  /* Parametric toss: eased travel + a parabola for the arc, with a little rotation. */
  function toss(setFn, from, to, o) {
    return U.tween(o.dur, (t, raw) => {
      const ex = o.easeX ? o.easeX(raw) : t;
      const x = U.lerp(from.x, to.x, ex);
      const y = U.lerp(from.y, to.y, t) - o.apex * 4 * raw * (1 - raw);
      const rot = o.rot0 * (1 - t) + (o.rotOvershoot || 0) * Math.sin(Math.PI * raw) * (1 - raw);
      const sc = U.lerp(o.s0, 1, Math.min(1, raw * 2.2));
      setFn(x, y, rot, sc);
    }, o.ease || U.ease.outCubic);
  }

  const props = {
    init() {
      folderEl = document.getElementById('folder'); folderImg = folderEl.querySelector('.folder-img');
      speakerEl = document.getElementById('speaker'); speakerFly = speakerEl.querySelector('.sp-fly');
      ZW.layout.onChange(() => { layoutFolder(); layoutSpeaker(); });
      layoutFolder(); layoutSpeaker();
    },
    get folderEl() { return folderEl; },
    get speakerEl() { return speakerEl; },

    /* ---------- folder ---------- */
    async spawnFolder() {                    // pops out between the character's open hands
      const c = ZW.hero.pocketPoint();
      folderEl.hidden = false; folderEl.disabled = true;
      folderEl.style.opacity = '0';
      setFolder(c.x, c.y, 0, 0.3);
      await U.nextFrame();
      folderEl.style.opacity = '1';
      folderEl.classList.add('pop');
      await U.wait(180);
    },
    async tossFolder() {
      const L = ZW.layout, from = ZW.hero.pocketPoint(), to = L.folderPos;
      folderEl.classList.remove('pop');
      await toss((x, y, r, s) => setFolder(x, y, r, s), from, to, {
        dur: 1250, apex: L.vh * 0.07, rot0: -16, rotOvershoot: 9, s0: 0.3, easeX: U.ease.outQuad,
      });
      // Gentle settle: two shrinking bounces.
      folderSettled = true;
      await U.tween(520, (t) => {
        const damp = Math.pow(1 - t, 2);
        folderBob = -Math.abs(Math.sin(t * Math.PI * 2.4)) * damp * L.vh * 0.014;
        setFolder(to.x, to.y + folderBob, 0, 1);
      });
      folderBob = 0; setFolder(to.x, to.y, 0, 1);
    },
    enableFolder(on) { folderEl.disabled = !on; folderEl.classList.toggle('ready', on); },

    /* ---------- speaker ---------- */
    async tossSpeaker() {
      const L = ZW.layout;
      layoutSpeaker();
      speakerEl.hidden = false; speakerEl.disabled = true; speakerEl.style.pointerEvents = 'none';
      speakerEl.style.opacity = '0';
      const r = speakerEl.getBoundingClientRect();
      const end = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const from = ZW.hero.pocketPoint();
      const setFly = (x, y, rot, sc) => {
        speakerFly.style.transform = 'translate3d(' + Math.round(x - end.x) + 'px,' + Math.round(y - end.y) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      };
      setFly(from.x, from.y, 0, 0.3);
      await U.nextFrame();
      speakerEl.style.opacity = '1';
      await toss(setFly, from, end, { dur: 1100, apex: L.vh * 0.14, rot0: -20, rotOvershoot: 12, s0: 0.3, ease: U.ease.inOutQuad });
      await U.tween(380, (t) => {                   // small settle: two little hops
        const damp = Math.pow(1 - t, 2);
        setFly(end.x, end.y - Math.abs(Math.sin(t * Math.PI * 2)) * damp * L.vh * 0.012, 0, 1);
      });
      speakerFly.style.transform = '';
      speakerEl.style.pointerEvents = '';
    },
    enableSpeaker(on) { speakerEl.disabled = !on; },
  };
  ZW.props = props;
})(window.ZW);
