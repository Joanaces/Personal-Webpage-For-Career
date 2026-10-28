/*
 * Pixel-RPG language menu (built in HTML/CSS, approved design):
 * navy panel + cream pixel border + pale-yellow cursor. Background, cursor and text are separate elements.
 * Mouse (hover moves the cursor, click selects), keyboard (Up/Down/W/S, 1/2, Enter/Space) and touch (tap).
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const U = ZW.util;
  let el, cursor, rows, index = 0, active = false, locked = false, resolver = null;

  function render() {
    const rowH = rows[0].offsetHeight;
    cursor.style.transform = 'translate3d(0,' + (index * rowH) + 'px,0)';
    rows.forEach((r, i) => { r.classList.toggle('active', i === index); r.setAttribute('aria-selected', i === index ? 'true' : 'false'); });
    el.setAttribute('aria-activedescendant', rows[index].id);
  }
  function move(delta) { index = (index + delta + rows.length) % rows.length; render(); }
  function setIndex(i) { if (i !== index) { index = i; render(); } }

  async function choose(i) {
    if (!active || locked) return;               // ignore repeated clicks/keys
    locked = true; index = i; render();
    const row = rows[i];
    row.classList.add('flash');                  // selection feedback: three quick blinks
    await U.wait(420);
    const done = resolver; resolver = null;
    if (done) done(row.dataset.lang);
  }

  function onKey(e) {
    if (!active || locked) return;
    switch (e.key) {
      case 'ArrowDown': case 's': case 'S': move(1); break;
      case 'ArrowUp': case 'w': case 'W': move(-1); break;
      case '1': setIndex(0); break;
      case '2': setIndex(1); break;
      case 'Enter': case ' ': choose(index); break;
      default: return;
    }
    e.preventDefault();
    if (e.key !== 'Enter' && e.key !== ' ') ZW.audio && ZW.audio.tick && ZW.audio.tick();
  }

  const menu = {
    init() {
      el = document.getElementById('lang-menu');
      cursor = el.querySelector('.menu-cursor');
      rows = Array.from(el.querySelectorAll('.menu-row'));
      rows.forEach((r, i) => {
        r.addEventListener('pointerenter', e => { if (active && !locked && e.pointerType === 'mouse') setIndex(i); });
        r.addEventListener('pointerdown', () => { if (active && !locked) setIndex(i); });
        r.addEventListener('click', () => choose(i));
      });
      window.addEventListener('keydown', onKey);
      ZW.layout.onChange(() => { if (active) render(); });
    },

    /* Show the menu and resolve with 'en' | 'zh' once the visitor has chosen. */
    open(preselect) {
      locked = false; active = true;
      rows.forEach(r => r.classList.remove('flash'));
      el.hidden = false; el.classList.remove('out'); el.classList.add('in');
      index = Math.max(0, rows.findIndex(r => r.dataset.lang === preselect));
      requestAnimationFrame(render);
      el.focus({ preventScroll: true });
      setTimeout(() => el.classList.remove('in'), 320);
      return new Promise(res => { resolver = res; });
    },
    async close() {
      active = false;
      el.classList.add('out'); await U.wait(260);
      el.hidden = true; el.classList.remove('out');
    },
  };
  ZW.menu = menu;
})(window.ZW);
