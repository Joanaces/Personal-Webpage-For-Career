/*
 * Centralised localisation. All visible text lives here, in explicit English and Simplified Chinese.
 * No runtime translation, no scattered language checks: UI code calls ZW.i18n.t('key').
 *
 * Keys marked [intro] are only ever shown before the visitor has chosen a language, so by design
 * they exist in English only (the brief supplies no Chinese greeting). They fall back to English.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const STORE = 'zw.lang';
  const dict = {
    en: {
      'intro.greeting': 'Nice to see you here! I am Zhiwei Zhou',          // [intro]
      'intro.question': 'Would you like me to speak English or Chinese?',   // [intro]
      'menu.en': "I'd like to hear English",
      'menu.zh': '我想用中文交流',
      'confirm': "Let's speak English!",
      'folder.say': 'Here is everything you need to know about me.',
      'folder.aria': 'Open the portfolio folder',
      'speaker.on': 'Music: on. Click to turn off',
      'speaker.off': 'Music: off. Click to turn on',
    },
    zh: {
      'menu.en': "I'd like to hear English",
      'menu.zh': '我想用中文交流',
      'confirm': '让我们说中文！',
      'folder.say': '如果您想要了解我，这里有您需要的资料。',
      'folder.aria': '打开作品集文件夹',
      'speaker.on': '音乐：开。点击关闭',
      'speaker.off': '音乐：关。点击开启',
    },
  };

  let lang = 'en';
  const listeners = [];

  function t(key) {
    return (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  }
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    (root || document).querySelectorAll('[data-i18n-aria]').forEach(el => {
      // The speaker label depends on audio state, so it is managed by audio.js.
      if (el.id === 'speaker') return;
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
  }
  function set(next, opts) {
    if (!dict[next]) return;
    lang = next;
    document.documentElement.lang = next === 'zh' ? 'zh-Hans' : 'en';
    document.documentElement.dataset.lang = next;
    if (!opts || opts.persist !== false) { try { localStorage.setItem(STORE, next); } catch (e) {} }
    apply();
    listeners.forEach(fn => fn(next));
  }
  function saved() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }

  ZW.i18n = { t, set, apply, saved, get lang() { return lang; }, onChange: fn => listeners.push(fn) };
})(window.ZW);
