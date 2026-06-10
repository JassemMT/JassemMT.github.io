/* ============================================================================
   APP.JS — render engine + interactions
   Builds all video cards from videos.js, handles hover-preview, the modal
   lightbox, category filtering, sticky nav and scroll reveals.
   No real .mp4 files are required: cards fall back to neutral placeholders.
   ============================================================================ */
(function () {
  "use strict";

  const DATA = window.PORTFOLIO_DATA || { VIDEOS: [], FEATURED_LAYOUT: {}, VRSS_VIDEOS: [] };
  const READY = !!DATA.MEDIA_READY;   // false → placeholder mode, no media requests
  const byFile = Object.fromEntries(DATA.VIDEOS.map(v => [v.file, v]));
  const CAT_LABEL = { entertainment: "Entertainment", educational: "Educational", corporate: "Corporate", showreel: "Showreel" };
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- path conventions ---- */
  const videoPath  = v => `videos/${v.cat}/${v.file}.mp4`;
  const posterPath = v => v.customThumb ? v.customThumb : `videos/${v.cat}/${v.file}.jpg`;
  const isImagePath = p => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(p || "");

  const BUNNY_CDN = "vz-0cb7ad4b-add.b-cdn.net";
  const getBunnyId = (url) => {
    if (!url) return null;
    const parts = url.split("?")[0].split("/");
    return parts[parts.length - 1];
  };
  const bunnyPreview = (v) => v.bunny ? `https://${BUNNY_CDN}/${getBunnyId(v.bunny)}/play_720p.mp4` : null;
  const bunnyThumb = (v) => v.bunny ? `https://${BUNNY_CDN}/${getBunnyId(v.bunny)}/thumbnail.jpg` : null;

  /* ---- per-item media: an entry is an IMAGE/GIF when `src` is an image file,
         otherwise it's a VIDEO (custom `src`, else the default <file>.mp4). ---- */
  const isImageItem = v => !!(v && v.src) && isImagePath(v.src);
  const mediaSrc    = v => v && v.src ? `videos/${v.cat}/${v.src}` : videoPath(v);

  /* ---- Autoplay items: compilations / highlight reels that loop muted in the
         card itself (not just on hover). Set `autoplay: true` on the entry. ---- */
  const isAutoplayItem = v => !!(v && v.autoplay) && !isImageItem(v);

  /* Pause autoplay cards when they scroll out of view (perf + battery). */
  const autoplayObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(en => {
          const vid = en.target;
          if (en.isIntersecting) { const p = vid.play(); if (p) p.catch(() => {}); }
          else vid.pause();
        });
      }, { threshold: 0.2 })
    : null;

  /* ---- tiny DOM helper ---- */
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---- First-frame thumbnail: when a video has no poster .jpg, decode its
         opening frame to a canvas and hand back a JPEG data-URL. Same-origin
         local files are not tainted, so toDataURL works. Fails silently. ---- */
  function captureFirstFrame(videoSrc, onFrame) {
    const probe = document.createElement("video");
    probe.muted = true; probe.playsInline = true; probe.preload = "auto";
    probe.crossOrigin = "anonymous";
    let done = false;
    const cleanup = () => { try { probe.removeAttribute("src"); probe.load(); } catch (e) {} };
    const grab = () => {
      if (done) return; done = true;
      try {
        const c = document.createElement("canvas");
        c.width = probe.videoWidth || 720;
        c.height = probe.videoHeight || 1280;
        c.getContext("2d").drawImage(probe, 0, 0, c.width, c.height);
        onFrame(c.toDataURL("image/jpeg", 0.82));
      } catch (e) { /* decode/taint failure — keep the placeholder */ }
      cleanup();
    };
    // Nudge past 0 so a real frame is painted, then capture once seeked.
    probe.addEventListener("loadeddata", () => { try { probe.currentTime = 0.1; } catch (e) { grab(); } }, { once: true });
    probe.addEventListener("seeked", grab, { once: true });
    probe.addEventListener("error", cleanup, { once: true });
    probe.src = videoSrc;
  }

  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const EXPAND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ========================================================================
     VIDEO CARD
     variant: "v" (vertical 9:16) | "h" (horizontal 16:9)
     ======================================================================== */
  function makeCard(v, variant) {
    if (!v) return null;
    const isImg = isImageItem(v);
    const card = el("article", `vcard vcard--${variant}`);
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${isImg ? "Enlarge" : "Play"}: ${v.title}`);
    card.dataset.cat = v.cat;
    card.dataset.file = v.file;

    const media = el("div", "vcard__media");
    const phClass = variant === "h" ? "ph ph--16x9" : "ph ph--9x16";
    const ph = el("div", phClass, '<div class="ph__grain"></div>' +
      `<span class="ph__tag">${variant === "h" ? "16:9" : "9:16"} · ${(CAT_LABEL[v.cat] || v.cat)}</span>`);
    media.appendChild(ph);

    // category badge
    media.appendChild(el("span", "vcard__badge", CAT_LABEL[v.cat] || v.cat));
    // corner affordance: play (video) or enlarge (image/gif)
    media.appendChild(el("button", "vcard__corner", isImg ? EXPAND_SVG : PLAY_SVG));

    // Load the real media over the placeholder (only when files exist).
    // Image/GIF items show the image itself (a GIF animates); videos show a poster.
    if (READY) {
      const img = new Image();
      img.className = "poster";
      img.loading = "lazy";
      img.alt = v.title;
      media.insertBefore(img, ph.nextSibling);
      
      if (isImg) {
        // Image/GIF item: show the file itself; no first-frame fallback.
        img.onerror = () => { img.style.display = "none"; };
        img.src = mediaSrc(v);
      } else {
        // Video item: try the local poster .jpg; if missing, try Bunny thumbnail,
        // then decode the video's first frame using the Bunny MP4 stream.
        img.onerror = () => {
          const bThumb = bunnyThumb(v);
          const bMp4 = v.bunny ? `https://${BUNNY_CDN}/${getBunnyId(v.bunny)}/play_720p.mp4` : mediaSrc(v);
          
          if (bThumb) {
            img.onerror = () => {
              img.style.display = "none";
              captureFirstFrame(bMp4, (url) => { 
                img.onerror = null; img.style.display = ""; img.src = url; 
              });
            };
            img.src = bThumb;
          } else {
            img.style.display = "none";
            captureFirstFrame(bMp4, (url) => { 
              img.onerror = null; img.style.display = ""; img.src = url; 
            });
          }
        };
        img.src = posterPath(v);
      }
    }

    card.appendChild(media);

    // Autoplay items (compilations / highlight reels): loop muted right in the
    // card, paused when off-screen. A small "tag" marks them; click still opens
    // the full video with sound in the lightbox.
    if (READY && isAutoplayItem(v)) {
      media.appendChild(el("span", "vcard__live", "● LIVE"));
      const bPrev = bunnyPreview(v);
      
      const avid = el("video", "vid");
      avid.muted = true; avid.loop = true; avid.playsInline = true; avid.preload = "auto";
      avid.autoplay = true; avid.setAttribute("muted", "");
      avid.poster = posterPath(v);
      avid.addEventListener("playing", () => avid.classList.add("is-playing"));
      avid.addEventListener("error", () => {
        if (bPrev && avid.src.includes("720p")) {
          avid.src = `https://${BUNNY_CDN}/${getBunnyId(v.bunny)}/play_480p.mp4`;
        } else {
          avid.remove();
        }
      });
      avid.src = bPrev || mediaSrc(v);
      media.appendChild(avid);
      const p = avid.play(); if (p) p.catch(() => {});
      if (autoplayObserver) autoplayObserver.observe(avid);
    }

    // text strip (vertical cards keep a little room for it — see CSS)
    const meta = el("div", "vcard__meta");
    meta.appendChild(el("h3", "vcard__title", v.title));
    if (v.client) meta.appendChild(el("p", "vcard__client", v.client));
    card.appendChild(meta);

    // hover preview (desktop only, VIDEO items only) — attempts the .mp4, stays on poster if missing
    // Autoplay items already loop on their own, so they skip the hover handler.
    if (supportsHover && READY && !isImg && !isAutoplayItem(v)) {
      const bPrev = bunnyPreview(v);
      let previewEl = null;
      card.addEventListener("mouseenter", () => {
        if (!previewEl) {
          previewEl = el("video", "vid");
          previewEl.muted = true; previewEl.loop = true; previewEl.playsInline = true; previewEl.preload = "auto";
          previewEl.addEventListener("playing", () => previewEl.classList.add("is-playing"));
          previewEl.addEventListener("error", () => {
            if (bPrev && previewEl.src.includes("720p")) {
              previewEl.src = `https://${BUNNY_CDN}/${getBunnyId(v.bunny)}/play_480p.mp4`;
            } else {
              previewEl && previewEl.remove(); previewEl = null;
            }
          });
          previewEl.src = bPrev || mediaSrc(v);
          media.appendChild(previewEl);
        } else {
          previewEl.classList.add("is-playing");
        }
        const p = previewEl && previewEl.play(); if (p) p.catch(() => {});
      });
      card.addEventListener("mouseleave", () => {
        if (previewEl) { 
          previewEl.pause();
          previewEl.classList.remove("is-playing");
        }
      });
    }

    // click / keyboard → modal
    const open = () => openModal(v);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });

    return card;
  }

  /* ========================================================================
     HIGHLIGHTED WORK (bento)
     Top band : big 16:9 horizontal VSL (left) + 1 vertical (right)
     Bottom band : the remaining vertical cards, equal columns
     ======================================================================== */
  function renderBento() {
    const root = document.getElementById("bento");
    if (!root) return;
    const L = DATA.FEATURED_LAYOUT || {};
    const big = byFile[L.bigCard];
    const verticals = (L.verticalCards || []).map(f => byFile[f]).filter(Boolean);

    if ((L.verticalCards || []).length > 5) {
      console.warn(`[bento] ${L.verticalCards.length} verticalCards provided; only the first 5 fit the layout (2 top-right + 3 bottom) — extras ignored.`);
    }

    // TOP: big 16:9 horizontal (left) + two vertical cards (right, fill the space)
    const top = el("div", "bento__top");
    if (big) top.appendChild(makeCard(big, "h"));
    const topRight = el("div", "bento__topright");
    verticals.slice(0, 2).forEach(v => topRight.appendChild(makeCard(v, "v")));
    top.appendChild(topRight);
    root.appendChild(top);

    // BOTTOM: the remaining vertical cards (up to 3)
    const bottom = el("div", "bento__bottom");
    verticals.slice(2, 5).forEach(v => bottom.appendChild(makeCard(v, "v")));
    root.appendChild(bottom);
  }

  /* ========================================================================
     WORK BY CATEGORY (filterable gallery)
     ======================================================================== */
  function renderGallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    DATA.VIDEOS
      .filter(v => v.cat !== "showreel")
      .forEach(v => grid.appendChild(makeCard(v, v.horizontal ? "h" : "v")));

    const filters = document.querySelectorAll("#filters .filter");
    filters.forEach(btn => {
      btn.addEventListener("click", () => {
        filters.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        const cat = btn.dataset.cat;
        grid.querySelectorAll(".vcard").forEach(card => {
          const show = cat === "all" || card.dataset.cat === cat;
          card.classList.toggle("is-hidden", !show);
          if (show) { card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; }
        });
      });
    });
  }

  /* ========================================================================
     VRSS CASE STUDY videos
     ======================================================================== */
  function renderCaseVideos() {
    const sections = document.querySelectorAll(".case__videos");
    if (!sections.length) return;
    sections.forEach(root => {
      // Resolution order:
      //  1. data-case="vrss|alex|scm"  → CASE_STUDIES[key]  (managed from the admin)
      //  2. data-files="id, id, id"     → inline list (legacy)
      //  3. otherwise                   → VRSS_VIDEOS  (legacy default)
      const CASES = DATA.CASE_STUDIES || {};
      const files = root.dataset.case
        ? (CASES[root.dataset.case] || [])
        : root.dataset.files
          ? root.dataset.files.split(",").map(s => s.trim()).filter(Boolean)
          : (DATA.VRSS_VIDEOS || []);
      // Each token is "id" (vertical) or "id:h" / "id:v" to force orientation.
      files.forEach(tok => {
        const [id, variant] = tok.split(":").map(s => s.trim());
        const v = byFile[id];
        if (v) root.appendChild(makeCard(v, variant === "h" ? "h" : "v"));
      });
    });
  }

  /* ========================================================================
     MODAL / LIGHTBOX
     ======================================================================== */
  const modal = document.getElementById("modal");
  const stage = document.getElementById("modal-stage");
  let lastFocus = null;

  function openModal(v) {
    if (v.bunny) {
      openMediaModal({
        bunny: v.bunny,
        title: v.title, client: v.client, instagram: v.instagram
      });
    } else if (isImageItem(v)) {
      openMediaModal({
        src: mediaSrc(v), image: true,
        title: v.title, client: v.client, instagram: v.instagram
      });
    } else {
      openMediaModal({
        src: mediaSrc(v), poster: posterPath(v), image: false,
        title: v.title, client: v.client, instagram: v.instagram
      });
    }
  }

  // Generic opener — plays a Bunny Stream embed, a local video, OR shows an image.
  function openMediaModal({ src, poster, image, bunny, title, client, instagram }) {
    lastFocus = document.activeElement;
    stage.innerHTML = "";

    const showPlaceholder = () => {
      stage.innerHTML = "";
      const ph = el("div", "ph ph--16x9",
        '<div class="ph__grain"></div>' + `<span class="ph__tag ph__tag--light">PREVIEW · ${title || ""}</span>`);
      const play = el("div", "reel__play reel__play--lg", PLAY_SVG);
      play.style.cursor = "default";
      ph.appendChild(play);
      stage.appendChild(ph);
    };

    if (bunny) {
      // Bunny Stream embed — remote, so it plays regardless of MEDIA_READY.
      const sep = bunny.includes("?") ? "&" : "?";
      const iframe = document.createElement("iframe");
      iframe.src = bunny + sep + "autoplay=true";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;";
      iframe.allowFullscreen = true;
      iframe.setAttribute("frameborder", "0");
      stage.appendChild(iframe);
    } else if (!READY) {
      // Placeholder mode — show the enlarged neutral poster, no network request.
      showPlaceholder();
    } else if (image) {
      const img = el("img");
      img.alt = title || "";
      img.addEventListener("error", showPlaceholder);
      img.src = src;
      stage.appendChild(img);
    } else {
      const vid = el("video");
      vid.controls = true; vid.autoplay = true; vid.playsInline = true; vid.preload = "auto";
      if (poster) vid.poster = poster;
      let fellBack = false;
      vid.addEventListener("error", () => { if (!fellBack) { fellBack = true; showPlaceholder(); } });
      vid.src = src;
      stage.appendChild(vid);
    }

    document.getElementById("modal-title").textContent = title || "";
    document.getElementById("modal-client").textContent = client || "";
    const ig = document.getElementById("modal-ig");
    if (instagram) { ig.href = instagram; ig.hidden = false; } else { ig.hidden = true; }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.querySelector(".modal__close").focus();
  }

  function closeModal() {
    const vid = stage.querySelector("video");
    if (vid) { vid.pause(); }
    stage.innerHTML = "";
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  modal.addEventListener("click", e => { if (e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  /* ========================================================================
     SHOWREEL (hero teaser + full section)
     Teaser: muted autoplay loop (placeholder until media exists).
     Full:   click to play with sound.
     ======================================================================== */
  function wireReels() {
    const showreels = DATA.VIDEOS.filter(v => v.cat === "showreel");
    const hasShowreel = showreels.length > 0;

    const showreelSection = document.getElementById("showreel");
    if (showreelSection) {
      showreelSection.style.display = hasShowreel ? "" : "none";
    }

    document.querySelectorAll('a[href="#showreel"]').forEach(link => {
      link.style.display = hasShowreel ? "" : "none";
    });

    document.querySelectorAll(".reel").forEach(reel => {
      let path = reel.dataset.reel; // e.g. "showreel/reel_main"
      const mode = reel.dataset.mode;
      
      // Update path to the actual showreel if one exists
      if (mode === "full" && hasShowreel) {
        path = `showreel/${showreels[0].file}`;
      }
      const ph = reel.querySelector(".ph");
      const src = `videos/${path}.mp4`;

      const tryVideo = (muted) => {
        const vid = el("video", "vid");
        vid.muted = muted; vid.loop = mode === "teaser"; vid.playsInline = true;
        vid.controls = mode === "full"; vid.preload = "auto";
        if (mode === "teaser") vid.autoplay = true;
        vid.poster = `videos/${path}.jpg`;
        vid.addEventListener("playing", () => vid.classList.add("is-playing"));
        vid.addEventListener("error", () => vid.remove());
        vid.src = src;
        ph.appendChild(vid);
        const p = vid.play(); if (p) p.catch(() => {});
        return vid;
      };

      if (mode === "teaser") {
        // The hero area is driven by HERO_MEDIA (videos.js) — image OR video.
        const file = (DATA.HERO_MEDIA || "").trim();
        const soundBtn = reel.querySelector(".reel__sound");
        const playBtn = reel.querySelector(".reel__play");
        const tag = reel.querySelector(".ph__tag");

        if (isImagePath(file)) {
          // ── IMAGE: just display it; strip the player chrome ──
          if (soundBtn) soundBtn.remove();
          if (playBtn) playBtn.remove();
          if (tag) tag.textContent = "SHOWREEL · IMAGE";
          if (READY && file) {
            const img = new Image();
            img.className = "poster";          // absolute fill, object-fit: cover
            img.alt = "Showreel";
            img.onload = () => ph.appendChild(img);
            img.onerror = () => {};
            img.src = "videos/" + file;
            reel.style.cursor = "zoom-in";
            ph.addEventListener("click", () =>
              openMediaModal({ src: "videos/" + file, image: true, title: "Showreel" }));
          }
        } else {
          // ── VIDEO: muted autoplay teaser + click to play with sound ──
          const vsrc = file ? "videos/" + file : `videos/${path}.mp4`;
          const vposter = file ? "videos/" + file.replace(/\.[^.]+$/, ".jpg") : `videos/${path}.jpg`;
          if (READY) {
            const vid = el("video", "vid");
            vid.muted = true; vid.loop = true; vid.playsInline = true; vid.autoplay = true; vid.preload = "auto";
            vid.poster = vposter;
            vid.addEventListener("playing", () => vid.classList.add("is-playing"));
            vid.addEventListener("error", () => vid.remove());
            vid.src = vsrc;
            ph.appendChild(vid);
            const p = vid.play(); if (p) p.catch(() => {});
          }
          if (soundBtn) soundBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const vid = ph.querySelector("video");
            if (!vid) return;
            vid.muted = !vid.muted;
            soundBtn.dataset.state = vid.muted ? "muted" : "on";
          });
          if (playBtn) playBtn.addEventListener("click", () =>
            openMediaModal({ src: vsrc, poster: vposter, image: false, title: "Showreel 2026", client: "Jassem" }));
        }
      } else {
        const playBtn = reel.querySelector(".reel__play");
        if (playBtn) playBtn.addEventListener("click", () => {
          if (!READY) { openReelModal(path); return; }
          const existing = ph.querySelector("video");
          if (existing) return;
          tryVideo(false);
        });
      }
    });
  }

  function openReelModal(path) {
    const v = { cat: path.split("/")[0], file: path.split("/")[1], title: "Showreel 2026", client: "Jassem", instagram: "" };
    openModal(v);
  }

  /* ========================================================================
     REVIEWS / TESTIMONIALS ("What clients say")
     Built from reviews.js — one <figure.t-card> per entry.
     ======================================================================== */
  function renderReviews() {
    const grid = document.getElementById("reviews-grid");
    if (!grid) return;
    const R = window.REVIEWS_DATA || { REVIEWS: [], AVATARS_READY: false };
    const list = R.REVIEWS || [];
    const avatarsReady = !!R.AVATARS_READY;

    const hasTestimonials = list.length > 0;
    const testimonialsSection = document.getElementById("testimonials");
    if (testimonialsSection) {
      testimonialsSection.style.display = hasTestimonials ? "" : "none";
    }
    document.querySelectorAll('a[href="#testimonials"]').forEach(link => {
      link.style.display = hasTestimonials ? "" : "none";
    });

    list.forEach(r => {
      if (!r || !r.quote) return;
      const card = el("figure", "t-card reveal");

      // stars (default 5, clamped 1–5)
      const n = Math.max(1, Math.min(5, r.stars == null ? 5 : r.stars));
      card.appendChild(el("div", "t-stars", "★".repeat(n)))
        .setAttribute("aria-hidden", "true");

      // quote (quotation marks added automatically)
      const q = el("blockquote");
      q.textContent = `"${r.quote}"`;
      card.appendChild(q);

      // figcaption: avatar + name/role
      const cap = el("figcaption");
      const avatar = el("span", "t-avatar");
      avatar.setAttribute("aria-hidden", "true");
      if (avatarsReady && r.avatar && isImagePath(r.avatar)) {
        const img = new Image();
        img.loading = "lazy";
        img.alt = r.name || "";
        img.onload = () => { avatar.style.background = "none"; avatar.appendChild(img); };
        img.onerror = () => {};
        img.src = `reviews/${r.avatar}`;
      }
      cap.appendChild(avatar);

      const meta = el("span", "t-meta");
      if (r.name) meta.appendChild(el("b", null, r.name));
      if (r.role) meta.appendChild(el("small", null, r.role));
      cap.appendChild(meta);

      card.appendChild(cap);
      grid.appendChild(card);
    });
  }

  /* ========================================================================
     SECTION RAIL  (scroll-spy navigator)
     Highlights the section nearest the top of the viewport and lets you
     jump to any section. Smooth-scroll is handled by CSS (html scroll-behavior).
     ======================================================================== */
  function wireRailNav() {
    const items = Array.from(document.querySelectorAll(".railnav__item"));
    if (!items.length) return;
    const targets = items
      .map(a => ({ a, sec: document.querySelector(a.getAttribute("href")) }))
      .filter(t => t.sec);
    if (!targets.length) return;

    let current = null;
    const setCurrent = (a) => {
      if (a === current) return;
      current = a;
      items.forEach(i => i.classList.toggle("is-current", i === a));
    };

    const spy = () => {
      // Section whose top is the last one above the 38% viewport line.
      const line = (window.innerHeight || 800) * 0.38;
      let best = targets[0];
      for (const t of targets) {
        if (t.sec.getBoundingClientRect().top <= line) best = t;
      }
      // Near page bottom → force the last section active.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        best = targets[targets.length - 1];
      }
      setCurrent(best.a);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { spy(); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    spy();
  }

  /* ========================================================================
     STICKY NAV + MOBILE MENU
     ======================================================================== */
  function wireNav() {
    const nav = document.querySelector(".nav");
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const burger = document.querySelector(".nav__burger");
    const links = document.querySelector(".nav__links");
    if (burger && links) {
      burger.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }));
    }
  }

  /* ========================================================================
     SCROLL REVEAL
     ======================================================================== */
  function wireReveal() {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    // Reveal anything whose top has entered the lower ~92% of the viewport.
    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      for (let i = items.length - 1; i >= 0; i--) {
        const el = items[i];
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > -40) {
          el.classList.add("in");
          items.splice(i, 1);
        }
      }
      if (!items.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { check(); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", check);
    requestAnimationFrame(check);   // after first paint (viewport sized)
    check();                        // initial pass
    // Failsafe: never leave content hidden if no scroll/resize ever fires.
    setTimeout(() => { items.slice().forEach(el => el.classList.add("in")); }, 500);
  }

  /* ========================================================================
     INIT
     ======================================================================== */
  function init() {
    renderBento();
    renderGallery();
    renderCaseVideos();
    renderReviews();
    wireReels();
    wireNav();
    wireRailNav();
    wireReveal();
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
