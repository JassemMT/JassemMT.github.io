# Jassem — Portfolio

A single-page, static portfolio for a video editor / motion designer.
Plain **HTML + CSS + vanilla JS** — no framework, no build step, no database.
Host it on Netlify, Cloudflare Pages, GitHub Pages, or any static host.

```
.
├── index.html      ← page structure + all section copy (edit text here)
├── styles.css      ← design tokens at the top (:root) + all styling
├── videos.js       ← SINGLE SOURCE OF TRUTH for every video card
├── app.js          ← renders cards, hover preview, modal, filtering
├── README.md
└── videos/         ← your media (create these folders)
    ├── showreel/   ← reel_main.mp4 / .jpg, vsl_1.mp4 / .jpg
    ├── entertainment/
    ├── educational/
    └── corporate/
```

The site ships in **placeholder mode**: until you add real media, every card
shows a neutral poster at the correct ratio with a play icon — nothing ever
looks broken. Drop your files in and they go live automatically.

---

## 1. Add a video (2 files + 1 line)

**Step 1 — drop two files** into the matching category folder, using the same base name:

```
videos/educational/edu_5.mp4    ← the video
videos/educational/edu_5.jpg    ← the poster (a still frame)
```

**Step 2 — add one line** to the `VIDEOS` array in `videos.js`:

```js
{ cat: "educational", file: "edu_5", title: "My new short", client: "Acme", instagram: "" },
```

That's it. The card appears in **Work by category** automatically and behaves
correctly (hover-to-preview on desktop, tap on mobile, click to open the player).

> **First time only:** when you add your very first real videos, open `videos.js`
> and set `const MEDIA_READY = true;`. This switches the site out of placeholder
> mode so it starts loading your `.mp4` / `.jpg` files. (While `false`, the site
> shows clean placeholders and makes no requests for missing media.)

- `cat` is one of: `entertainment` · `educational` · `corporate` · `showreel`
- `file` is the base filename (no extension). Paths are derived by convention:
  `videos/<cat>/<file>.mp4` and `videos/<cat>/<file>.jpg`.
- `title` short label shown under the card. `client` optional. `instagram` optional link.

### Generate posters in bulk
Run inside a category folder to make a `.jpg` from the first frame of every clip:

```bash
for f in *.mp4; do ffmpeg -i "$f" -vframes 1 "${f%.mp4}.jpg"; done
```

---

## 2. Change the Highlighted Work bento

Open `videos.js` and edit `FEATURED_LAYOUT`. It lists, by `file` id, exactly
what fills each fixed slot of the bento (so a limited number of clips still fills it):

```js
const FEATURED_LAYOUT = {
  bigCard: "vsl_1",                                   // 1 large HORIZONTAL 16:9 (showreel / VSL)
  verticalCards: ["ent_1", "edu_1", "cor_1", "ent_2"],// up to 4 vertical 9:16 cards
};
```

- Reference any clip by its `file` id (it must exist in `VIDEOS`).
- The layout never breaks: extra `verticalCards` beyond the 4 slots are ignored
  (you'll see a `console.warn`).

The **VRSS case study** videos are set the same way, just below:

```js
const VRSS_VIDEOS = ["edu_2", "ent_1", "cor_2"];
```

---

## 3. Edit text & numbers

- **Section copy** (hero, messages, case study, testimonials, footer) lives
  directly in `index.html` — each section is labelled with a comment.
- **Card titles / clients / Instagram links** live in `videos.js`.
- **Colors, fonts, radius, spacing** live in the `:root` block at the top of
  `styles.css`. Change `--accent` to re-theme the whole site.

---

## 4. The showreel & hero

**Hero area (top of the page)** — controlled by `HERO_MEDIA` in `videos.js`.
Point it at a **video** or an **image**; the site detects which by extension:

```js
const HERO_MEDIA = "showreel/reel_main.mp4";  // video → muted looping teaser, click to play w/ sound
// const HERO_MEDIA = "showreel/hero.jpg";    // image → shown as a still (click to enlarge)
```

Drop the file at `videos/<that path>` and set `MEDIA_READY = true`.

**Dedicated Showreel section** — the full cut, click to play **with sound**, from
`videos/showreel/reel_main.(mp4|jpg)`. Change it via the `data-reel` attribute in `index.html`.

---

## 5. Deploy

**Netlify** — drag the project folder onto <https://app.netlify.com/drop>, or:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

**Cloudflare Pages** — push to a Git repo, then in the Cloudflare dashboard:
*Pages → Create → Connect to Git*. Framework preset: **None**.
Build command: *(leave empty)*. Build output directory: `/` (the root).

**GitHub Pages** — push to a repo and enable Pages on the `main` branch (root).

No build step is needed — these are plain static files.

---

## Notes

- **Performance:** posters are lazy-loaded, videos use `preload="none"` and are
  only created on hover/click, and only one preview plays at a time.
- **Accessibility:** cards are keyboard-focusable (Enter/Space to open), the
  modal closes on `Esc` / backdrop click, focus returns to the card, and images
  carry `alt` text.
- **Reduced motion:** entrance animations are disabled for users who prefer it.
