/* Boot: layout -> modules -> asset preload -> story. */
(function (ZW) {
  function preloadImages(urls) {
    return Promise.all(urls.map(u => new Promise(res => {
      const im = new Image(); im.onload = im.onerror = () => res(); im.src = u;
      if (im.decode) im.decode().then(res, res);
    })));
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(r => setTimeout(r, ms))]); }

  function boot() {
    ZW.layout.init();
    ZW.i18n.apply();
    ZW.camera.init();
    ZW.hero.init();
    ZW.dialogue.init();
    ZW.menu.init();
    ZW.langSwitch.init();
    ZW.props.init();
    ZW.audio.init();

    const bar = document.querySelector('.loader-bar i');
    const imgs = ['sky-base', 'clouds-far', 'clouds-near', 'hill', 'taskbar', 'character', 'bubble', 'folder', 'speaker']
      .map(n => 'assets/img/' + n + '.png');
    let done = 0; const total = imgs.length + 1;
    const tick = () => { done++; bar.style.width = Math.round(done / total * 100) + '%'; };
    const loads = imgs.map(u => preloadImages([u]).then(tick));
    // The supplied font is large (CJK): wait for it, but never block the page for more than 15 s.
    const font = withTimeout(Promise.all([
      document.fonts.load('28px ZWFont', "Nice to see you! I'd like English"),
      document.fonts.load('28px ZWFont', '让我们说中文！我想用中文交流'),
    ]).catch(() => {}), 15000).then(tick);

    // The folder is the future entry point to the resume. Sections are not built yet: announce the intent only.
    document.getElementById('folder').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('zw:folder-open'));
    });

    // Clicking the empty background while the character just stands there -> a gentle reassurance.
    document.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('button, #lang-switch, #lang-menu, #bubble')) return;
      ZW.story.patience();
    });

    ZW.story.run(Promise.all([...loads, font]));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.ZW);
