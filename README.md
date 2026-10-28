# Zhiwei Zhou — interactive pixel-art resume (homepage)

Plain HTML/CSS/JS, no build step, no dependencies. All paths are relative, so it works on GitHub Pages
(and by opening `index.html` directly; a local server such as `python3 -m http.server` is recommended).

```
index.html
css/style.css
js/  util · i18n · layout · camera · hero · dialogue · menu · props · audio · story · main
assets/img     sky-base, clouds-far, clouds-near, hill, taskbar (split from your landscape), character (sprite sheet),
               bubble, folder, speaker (your artwork, cut out / cleaned)
assets/audio   background-music.mp3, click.mp3
assets/fonts   font.ttf
```

Key places to edit later
- All text, both languages: `js/i18n.js`
- Story order / camera damping per state: `CFG` in `js/story.js`
- Character size and the 75% feet line: `js/layout.js`
- Timings: `js/story.js`, `js/hero.js`, `js/props.js`

The folder dispatches a `zw:folder-open` event on click; the resume sections will hook into it.
