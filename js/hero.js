/*
 * The pixel character. Uses the supplied frames only (character.png = 5x4 sheet of 256px cells):
 *   row 0  still   front-facing standing pose (supplied PNG)
 *   row 1  arms    arms out -> arms raised (supplied GIF, 5 frames)
 *   row 2  talk    front-facing, frames 1 and 3 have the mouth open (supplied GIF) - used ONLY while speaking
 *   row 3  walk    side view facing right; frames 1 and 3 are the steps, 0/2/4 are the stance (supplied GIF)
 *   row 4  pocket  6 frames: hands slide into the pockets (supplied GIF) - played before taking out an object
 * When nothing is being said or done the character shows the static still pose.
 * Position is driven only from here (one writer for the hero's transform).
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const ROW = { still: 0, arms: 1, talk: 2, walk: 3, pocket: 4 };
  const WALK_CYCLE = [1, 0, 3, 0];
  const U = ZW.util;
  let el, x = 0, talkTimer = 0, talking = false, posing = false, lastBG = '';

  function frame(row, col) {
    const L = ZW.layout, c = L.cell;
    const v = (-col * c) + 'px ' + (-ROW[row] * c) + 'px';
    if (v !== lastBG) { lastBG = v; el.style.backgroundPosition = v; }
  }
  function place() {
    const L = ZW.layout;
    el.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(L.heroY) + 'px,0)';
  }
  function layout() {
    const L = ZW.layout;
    el.style.width = el.style.height = L.cell + 'px';
    el.style.backgroundSize = (L.cell * 6) + 'px ' + (L.cell * 5) + 'px';
    lastBG = ''; // force background-position refresh
    if (hero.standing) x = L.heroFinalX;
    place();
    frame(hero.row, hero.col);
  }

  const hero = {
    row: 'still', col: 0, standing: false,
    init() {
      el = document.getElementById('hero');
      ZW.layout.onChange(layout);
      layout();
    },
    set(row, col) { hero.row = row; hero.col = col; frame(row, col); },
    show() { el.hidden = false; },
    setX(v) { x = v; place(); },

    /* Walk in from the left, decelerating into the final spot. Steps are driven by distance travelled. */
    async walkIn(dur) {
      const L = ZW.layout;
      hero.standing = false; hero.stopIdle();
      x = L.heroStartX; place(); hero.set('walk', 0);
      el.hidden = false;
      if (U.reduced) { x = L.heroFinalX; place(); hero.set('still', 0); hero.standing = true; return; }
      const stride = 26 * L.cs; // sprite-space distance per walk beat
      let lastBeat = -1;
      hero.set('walk', 0);
      await U.tween(dur, (t) => {
        const from = L.heroStartX, to = L.heroFinalX;
        x = from + (to - from) * t;
        const beat = Math.floor((x - from) / stride);
        if (beat !== lastBeat) { lastBeat = beat; hero.set('walk', WALK_CYCLE[((beat % 4) + 4) % 4]); }
        place();
      }, U.ease.outCubic);
      x = L.heroFinalX; place();
      hero.set('walk', 0);             // settle on the side-facing stance...
      await U.wait(380);
      hero.set('still', 0);            // ...then turn to face the visitor
      hero.standing = true;
    },

    /* Resting pose: the static still image. No idle animation by design. */
    startIdle() { hero.talk(false); if (!posing) hero.set('still', 0); },
    stopIdle() { hero.talk(false); },

    /* Mouth animation from the supplied talk frames; only while a line is being typed. */
    talk(on) {
      if (!on) { talking = false; clearTimeout(talkTimer); if (!posing && hero.standing) hero.set('still', 0); return; }
      if (talking || posing || !hero.standing || U.reduced) return;
      talking = true; let i = 0;
      const seq = [1, 0, 3, 0];
      (function tick() { if (!talking) return; hero.set('talk', seq[i++ % 4]); talkTimer = setTimeout(tick, 130); })();
    },

    /* Reach into the pockets (supplied 6-frame GIF), then hold the last frame. Resolves when the hands are in. */
    async reach() {
      hero.talk(false); posing = true;
      if (U.reduced) { hero.set('pocket', 5); return; }
      for (let f = 0; f < 6; f++) { hero.set('pocket', f); await U.wait(f === 0 ? 180 : 130); }
      await U.wait(160);
    },
    /* Arms animation (supplied GIF): out -> up. Resolves at the release moment. */
    async raise() {
      hero.set('arms', 1); await U.wait(200);
      hero.set('arms', 2); await U.wait(140);
      hero.set('arms', 3);                      // arms up: release moment (caller launches the object)
    },
    async hold() { hero.set('arms', 4); },
    async relax() {
      hero.set('arms', 2); await U.wait(130);
      hero.set('arms', 1); await U.wait(130);
      hero.set('still', 0);
      posing = false;
    },
    /* Where the objects come out: at the hip, between the pockets. */
    pocketPoint() {
      const L = ZW.layout;
      return { x: x + L.SPR.centerX * L.cs, y: L.heroY + 166 * L.cs };
    },
    /* Where the hero's hands are (screen px), for spawning objects. */
    chestPoint() {
      const L = ZW.layout;
      return { x: x + L.SPR.centerX * L.cs, y: L.heroY + L.SPR.chestY * L.cs };
    },
  };
  ZW.hero = hero;
})(window.ZW);
