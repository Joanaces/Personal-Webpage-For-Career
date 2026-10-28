/*
 * Top-right language switch (appears after the first language choice, stays for the whole visit).
 * Pixel panel built in CSS, matching the language menu. Switching re-renders everything via ZW.i18n.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  let el, btns;
  function sync() {
    btns.forEach(b => { const on = b.dataset.lang === ZW.i18n.lang; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    el.setAttribute('aria-label', ZW.i18n.t('lang.aria') + ' / ' + (ZW.i18n.lang === 'zh' ? 'Language' : '语言'));
  }
  ZW.langSwitch = {
    init() {
      el = document.getElementById('lang-switch'); btns = Array.from(el.querySelectorAll('button'));
      btns.forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== ZW.i18n.lang) ZW.i18n.set(b.dataset.lang); }));
      ZW.i18n.onChange(sync);
    },
    show() { sync(); el.hidden = false; el.classList.add('in'); setTimeout(() => el.classList.remove('in'), 320); },
  };
})(window.ZW);
