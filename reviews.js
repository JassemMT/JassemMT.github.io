/* ============================================================================
   REVIEWS.JS — SINGLE SOURCE OF TRUTH (the "What clients say" section)
   ----------------------------------------------------------------------------
   The whole testimonials grid builds itself from the data in this file.
   To add, remove, or edit a review you ONLY touch this file — nothing else.

   ▸ EACH ENTRY IS ONE REVIEW CARD. Fields:

       quote   (required)  what the client said. Quotation marks are added
                           automatically — just write the sentence.
       name    (required)  person's name           → shown in bold
       role                their title / company    → shown small + muted
       stars               1–5 rating (default 5)   → row of ★
       avatar              a photo file name (optional). Drop the image into
                           the  reviews/  folder and put the file name here:
                             avatar: "alex.jpg"   → loads reviews/alex.jpg
                           Accepts .jpg .jpeg .png .webp .gif .avif .svg
                           No avatar? A neutral gradient circle is used instead.

       That's it — the card goes live automatically (no other wiring).

   ▸ Until a real avatar image exists, every card shows the neutral gradient
     circle — nothing ever looks broken, and no failed requests are made.
   ============================================================================ */

const REVIEWS = [
  {
    quote: "Reliable, fast and genuinely premium. Our shorts finally match the quality of the brand.",
    name: "Alex Mercer",
    role: "Founder · VRSS Fightgear",
    stars: 5,
    avatar: "" // e.g. "alex.jpg" → reviews/alex.jpg
  },
  {
    quote: "The motion design is on another level. Each edit feels considered — not a template in sight.",
    name: "Dana Kim",
    role: "Head of Content · Studio Form",
    stars: 5,
    avatar: ""
  },
  {
    quote: "We saw real growth within weeks. Jassem understands pacing, hooks and retention.",
    name: "Marco Vidal",
    role: "Creator · 480K followers",
    stars: 5,
    avatar: ""
  },
];

/* ----------------------------------------------------------------------------
   AVATARS READY?  ── set to `true` once you've added your first real photos to
   the  reviews/  folder. While `false`, the site stays in clean placeholder
   mode and makes NO requests for missing avatars (no console errors).
   Flip to `true` and any card that has an `avatar` file name goes live.
   ---------------------------------------------------------------------------- */
const AVATARS_READY = false;

/* Expose to the render engine (app.js) */
window.REVIEWS_DATA = { REVIEWS, AVATARS_READY };
