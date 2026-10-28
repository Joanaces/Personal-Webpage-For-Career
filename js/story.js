/*
 * Narrative state machine. One deterministic sequence; each state declares what is visible,
 * which interactions are enabled and how much the camera may follow the mouse.
 * Scenes never run twice and never overlap: go() only accepts the next state in order.
 */
window.ZW = window.ZW || {};
(function (ZW) {
  const U = ZW.util;
  const ORDER = [
    'INITIAL_LOADING', 'SCENE_READY', 'CHARACTER_ENTERING', 'GREETING', 'LANGUAGE_QUESTION', 'LANGUAGE_SELECTION',
    'LANGUAGE_CONFIRMATION', 'FOLDER_REVEAL', 'FOLDER_IDLE', 'SPEAKER_REVEAL', 'HOMEPAGE_IDLE',
  ];
  // camera: how much the mouse may move the camera. menu/folder/speaker: interactions enabled in that state.
  const CFG = {
    INITIAL_LOADING:       { camera: 0,    menu: false, folder: false, speaker: false },
    SCENE_READY:           { camera: 1,    menu: false, folder: false, speaker: false },
    CHARACTER_ENTERING:    { camera: 0.3,  menu: false, folder: false, speaker: false },
    GREETING:              { camera: 0.6,  menu: false, folder: false, speaker: false },
    LANGUAGE_QUESTION:     { camera: 0.6,  menu: false, folder: false, speaker: false },
    LANGUAGE_SELECTION:    { camera: 0.7,  menu: true,  folder: false, speaker: false },
    LANGUAGE_CONFIRMATION: { camera: 0.6,  menu: false, folder: false, speaker: false },
    FOLDER_REVEAL:         { camera: 0.2,  menu: false, folder: false, speaker: false },
    FOLDER_IDLE:           { camera: 0.7,  menu: false, folder: true,  speaker: false },
    SPEAKER_REVEAL:        { camera: 0.2,  menu: false, folder: true,  speaker: false },
    HOMEPAGE_IDLE:         { camera: 1,    menu: false, folder: true,  speaker: true },
  };

  let current = null, busy = false, patienceToken = 0;
  const stage = () => document.getElementById('stage');

  function enter(name) {
    const i = ORDER.indexOf(name), cur = ORDER.indexOf(current);
    if (i !== cur + 1) { console.warn('[story] ignored out-of-order transition', current, '->', name); return false; }
    current = name; stage().dataset.state = name;
    const c = CFG[name];
    ZW.camera.setGain(c.camera);
    ZW.props.enableFolder(c.folder && name !== 'INITIAL_LOADING');
    ZW.props.enableSpeaker(c.speaker);
    return true;
  }

  async function playFolderBeat() {
    const hero = ZW.hero, props = ZW.props;
    await hero.reach();                       // hands into the pockets...
    await props.spawnFolder();                // ...and the folder comes out
    await hero.raise();                       // arms up: release
    const flight = props.tossFolder();
    await U.wait(520); await hero.hold();
    await flight;
    await hero.relax();
    await ZW.dialogue.say('folder.say');      // line arrives once the folder has settled
    await U.wait(900);
  }
  async function playSpeakerBeat() {
    const hero = ZW.hero, props = ZW.props;
    await hero.reach();                       // second trip into the pockets
    await U.wait(120);
    await hero.raise();
    const flight = props.tossSpeaker();
    await U.wait(520); await hero.hold();
    await flight;
    props.enableSpeaker(true);                // the music button can be used as soon as it lands
    await hero.relax();
    await ZW.dialogue.say('music.hint');
    await U.wait(3400);
    await ZW.dialogue.hide();
  }

  const story = {
    get state() { return current; },
    /* Visitor clicked the empty background while the character is just standing there. */
    async patience() {
      if (current !== 'HOMEPAGE_IDLE') return;
      const tok = ++patienceToken;
      if (!(ZW.dialogue.visible && ZW.dialogue.key === 'idle.patient')) await ZW.dialogue.say('idle.patient');
      if (tok !== patienceToken) return;
      await U.wait(3800);
      if (tok !== patienceToken) return;
      await ZW.dialogue.hide();
    },
    async run(assetsReady) {
      if (busy) return; busy = true;
      current = null;
      enter('INITIAL_LOADING');
      await assetsReady;

      enter('SCENE_READY');
      document.getElementById('loader').classList.add('done');
      await U.wait(1100);                                  // let the scene settle

      enter('CHARACTER_ENTERING');
      await ZW.hero.walkIn(3800);
      ZW.hero.startIdle();
      await U.wait(650);

      enter('GREETING');
      await ZW.dialogue.say('intro.greeting');
      await U.wait(1500);

      enter('LANGUAGE_QUESTION');
      await ZW.dialogue.hide();                            // a separate dialogue event
      await U.wait(250);
      await ZW.dialogue.say('intro.question');
      await U.wait(900);                                   // let the visitor read it before the choices appear

      enter('LANGUAGE_SELECTION');
      const lang = await ZW.menu.open(ZW.i18n.saved());

      enter('LANGUAGE_CONFIRMATION');
      ZW.i18n.set(lang);                                   // whole interface switches
      ZW.langSwitch.show();                                // top-right EN / 中文 switch from now on
      await ZW.menu.close();
      await ZW.dialogue.hide();
      await U.wait(200);
      await ZW.dialogue.say('confirm');
      await U.wait(1400);
      await ZW.dialogue.hide();
      await U.wait(250);

      enter('FOLDER_REVEAL');
      await playFolderBeat();

      enter('FOLDER_IDLE');
      await U.wait(900);

      enter('SPEAKER_REVEAL');
      await ZW.dialogue.hide();
      await playSpeakerBeat();

      enter('HOMEPAGE_IDLE');
      document.dispatchEvent(new CustomEvent('zw:homepage-idle'));
    },
  };
  ZW.story = story;
})(window.ZW);
