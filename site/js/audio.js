/*
 * Audio. Two supplied files only:
 *   assets/audio/background-music.mp3  looping music, started ONLY by an intentional click on the speaker
 *   assets/audio/click.mp3             short click sound on every visitor click / Enter
 * Playback state is kept separate from the narrative; the speaker icon mirrors the element's real state.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const MUSIC_VOL = 0.55, FADE_IN = 1400, FADE_OUT = 600;
  let music, speaker, fadeRaf = 0, intended = false;
  const clicks = []; let clickIdx = 0;

  function fade(to, dur) {
    cancelAnimationFrame(fadeRaf);
    return new Promise(res => {
      const from = music.volume, t0 = performance.now();
      if (ZW.util.reduced) dur = 0;
      (function step(now) {
        const t = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur);
        music.volume = Math.max(0, Math.min(1, from + (to - from) * t));
        if (t < 1) fadeRaf = requestAnimationFrame(step); else res();
      })(t0);
    });
  }

  function syncIcon() {
    const playing = !!music && !music.paused && !music.ended;
    speaker.classList.toggle('on', playing);
    speaker.classList.toggle('off', !playing);
    speaker.setAttribute('aria-pressed', playing ? 'true' : 'false');
    speaker.setAttribute('aria-label', ZW.i18n.t(playing ? 'speaker.on' : 'speaker.off'));
  }

  const audio = {
    init() {
      speaker = document.getElementById('speaker');
      music = new Audio('assets/audio/background-music.mp3');
      music.loop = true; music.preload = 'none'; music.volume = 0;
      ['play', 'playing', 'pause', 'ended', 'error', 'emptied'].forEach(ev => music.addEventListener(ev, syncIcon));

      for (let i = 0; i < 4; i++) { const a = new Audio('assets/audio/click.mp3'); a.preload = 'auto'; clicks.push(a); }
      // Click sound for every deliberate pointer press (the speaker, folder, menu, bubble...).
      window.addEventListener('pointerdown', e => { if (e.button === 0 || e.pointerType !== 'mouse') audio.click(); }, true);
      ZW.i18n.onChange(syncIcon);
      speaker.addEventListener('click', audio.toggle);
      syncIcon();
    },
    click() {
      const a = clicks[clickIdx++ % clicks.length];
      try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    },
    tick() { audio.click(); },
    get playing() { return !!music && !music.paused; },

    async toggle() {
      if (speaker.disabled) return;
      if (!music.paused && intended) {              // currently playing -> fade out, keep position
        intended = false;
        await fade(0, FADE_OUT);
        music.pause(); syncIcon();
        return;
      }
      intended = true;
      try {
        music.volume = 0;
        await music.play();                          // allowed: this runs inside the click gesture
        await fade(MUSIC_VOL, FADE_IN);
      } catch (err) {                                // blocked / failed to load: stay honestly "off"
        intended = false; music.pause(); syncIcon();
        speaker.classList.add('shake'); setTimeout(() => speaker.classList.remove('shake'), 400);
        console.warn('[music] playback failed:', err && err.message ? err.message : err);
      }
    },
  };
  ZW.audio = audio;
})(window.ZW);
