/*
 * Speech bubble. The supplied bubble artwork is a 9-slice background; text is rendered with the supplied font,
 * so any sentence works in either language. The bubble is anchored with its tail tip just above the
 * character's head, never over the face.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const U = ZW.util;
  let el, textEl, typing = null, visible = false;

  function anchor() {
    const L = ZW.layout;
    const margin = Math.max(10, L.u * 1.5);
    const bw = Math.round(ZW.util.clamp(L.vw * 0.36, Math.min(L.vw - 2 * margin, 300), 680));
    el.style.width = bw + 'px';
    // Tail tip is 10.5 art-pixels from the left edge of the artwork, at its bottom edge.
    const tipX = L.vw / 2 + 5.5 * L.ap, tipY = L.headTopY - L.ap * 1.2;
    let left = tipX - 10.5 * L.u, flip = false;
    if (left + bw > L.vw - margin) {               // not enough room on the right: mirror the artwork
      left = tipX - bw + 10.5 * L.u; flip = true;
      if (left < margin) left = margin;
    }
    el.style.left = Math.round(left) + 'px';
    el.style.bottom = Math.round(L.vh - tipY) + 'px';
    el.classList.toggle('flip', flip);
  }

  function prepare(text) {
    // Every character becomes a span (hidden until typed) so the bubble keeps its final size from the first frame.
    textEl.textContent = '';
    const frag = document.createDocumentFragment(), chars = [];
    for (const word of text.split(/(\s+)/)) {
      if (word === '') continue;
      const w = document.createElement('span'); w.className = 'w';
      for (const ch of word) { const s = document.createElement('span'); s.className = 'c'; s.textContent = ch; w.appendChild(s); chars.push(s); }
      frag.appendChild(w);
    }
    textEl.appendChild(frag);
    return chars;
  }

  const dialogue = {
    init() {
      el = document.getElementById('bubble'); textEl = el.querySelector('.bubble-text');
      ZW.layout.onChange(() => { if (visible) anchor(); });
    },
    get visible() { return visible; },

    /* Pop the bubble in and type `text`. Resolves when the whole line is readable. */
    async say(text) {
      const L = ZW.layout;
      if (typing) typing.finish();
      const chars = prepare(text);
      anchor();
      if (!visible) {
        el.hidden = false; visible = true;
        el.classList.remove('out'); el.classList.add('in');
        await U.wait(220);
        el.classList.remove('in');
      }
      const cjk = /[　-鿿＀-￯]/.test(text);
      const per = U.reduced ? 0 : (cjk ? 70 : 34);
      await new Promise(resolve => {
        let i = 0, timer = 0, done = false;
        const finish = () => { if (done) return; done = true; clearTimeout(timer); chars.forEach(c => c.classList.add('on')); typing = null; resolve(); };
        typing = { finish };
        if (per === 0) { finish(); return; }
        (function tick() {
          if (done) return;
          if (i < chars.length) { chars[i++].classList.add('on'); timer = setTimeout(tick, per); } else finish();
        })();
      });
    },
    /* Visitor clicked while text is typing: show the rest immediately. */
    skip() { if (typing) typing.finish(); },

    async hide() {
      if (!visible) return;
      if (typing) typing.finish();
      el.classList.add('out'); await U.wait(200);
      el.hidden = true; el.classList.remove('out'); visible = false; textEl.textContent = '';
    },
  };
  ZW.dialogue = dialogue;
})(window.ZW);
