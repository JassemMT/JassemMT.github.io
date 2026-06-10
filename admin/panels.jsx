/* ============================================================================
   PANELS.JSX — Highlighted work, Case studies, Hero & showreel panels.
   ============================================================================ */
(function () {
  const { useState } = React;
  const { CAT_LABEL, cls } = window.AdminConst;
  const { Ic, Thumb } = window;

  const parseTok = t => { const [id, o] = String(t).split(":"); return { id: id.trim(), o: (o || "").trim() }; };
  const mkTok = (id, o) => o ? `${id}:${o}` : id;

  /* ---- ordered slot list with reorder / remove / add ---- */
  function SlotList({ tokens, byFile, onChange, max, orient, emptyHint }) {
    const items = tokens.map(parseTok);
    const move = (i, d) => {
      const j = i + d; if (j < 0 || j >= items.length) return;
      const next = items.slice(); [next[i], next[j]] = [next[j], next[i]];
      onChange(next.map(x => mkTok(x.id, x.o)));
    };
    const remove = i => onChange(items.filter((_, k) => k !== i).map(x => mkTok(x.id, x.o)));
    const setO = (i, o) => { const next = items.slice(); next[i] = { ...next[i], o }; onChange(next.map(x => mkTok(x.id, x.o))); };
    const add = id => { if (!id) return; if (max && items.length >= max) return; onChange([...tokens, id]); };

    const used = items.map(x => x.id);
    const options = Object.values(byFile).filter(v => v);

    return (
      <div>
        <div className="slotlist">
          {items.length === 0 && <div style={{ fontSize: ".8rem", color: "var(--faint)", padding: "8px 2px" }}>{emptyHint || "No videos yet."}</div>}
          {items.map((it, i) => {
            const v = byFile[it.id];
            const isH = it.o === "h" || (v && v.cat === "showreel" && it.o !== "v");
            return (
              <div className="slot" key={it.id + i}>
                <span className="slot__num">{i + 1}</span>
                <div className={cls("slot__thumb", isH && "slot__thumb--h")}><Thumb v={v} variant={isH ? "h" : "v"} /></div>
                <div className="slot__main">
                  <div className="slot__t">{v ? (v.title || "Untitled") : <span style={{ color: "var(--danger)" }}>missing: {it.id}</span>}</div>
                  <div className="slot__m">{it.id}{v && v.client ? ` · ${v.client}` : ""}</div>
                </div>
                <div className="slot__ctrl">
                  {orient && (
                    <div className="seg" title="Orientation">
                      <button className={cls(it.o !== "h" && "is-active")} onClick={() => setO(i, "v")}>V</button>
                      <button className={cls(it.o === "h" && "is-active")} onClick={() => setO(i, "h")}>H</button>
                    </div>
                  )}
                  <button className="iconbtn" disabled={i === 0} onClick={() => move(i, -1)} title="Up">{Ic.up}</button>
                  <button className="iconbtn" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="Down">{Ic.down}</button>
                  <button className="iconbtn" onClick={() => remove(i)} title="Remove">{Ic.x}</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="addrow">
          <select className="selectbox" value="" disabled={max && items.length >= max} onChange={e => add(e.target.value)}>
            <option value="">{max && items.length >= max ? `Maximum ${max} reached` : "+ Add a video…"}</option>
            {options.map(v => <option key={v.file} value={v.file}>{(v.title || v.file)} — {v.file}{used.includes(v.file) ? " (added)" : ""}</option>)}
          </select>
        </div>
      </div>
    );
  }

  /* ---- bento preview ---- */
  function BentoPreview({ featured, byFile }) {
    const big = byFile[featured.bigCard];
    const verts = (featured.verticalCards || []).map(f => byFile[f]);
    const Slot = ({ v, h, label }) => (
      <div className={cls("pslot", h && "pslot--h")}>
        {v ? <Thumb v={v} variant={h ? "h" : "v"} /> : <span>{label}</span>}
        {v && <div className="pslot__cap">{v.title || v.file}</div>}
      </div>
    );
    return (
      <div className="bento-prev">
        <div className="bento-prev__top">
          <Slot v={big} h label="big 16:9" />
          <Slot v={verts[0]} label="vert 1" />
          <Slot v={verts[1]} label="vert 2" />
        </div>
        <div className="bento-prev__bot">
          <Slot v={verts[2]} label="vert 3" />
          <Slot v={verts[3]} label="vert 4" />
          <Slot v={verts[4]} label="vert 5" />
        </div>
      </div>
    );
  }

  function FeaturedPanel({ featured, videos, byFile, onChange }) {
    return (
      <div className="panel">
        <div className="panel__head">
          <div>
            <span className="eyebrow">Homepage · bento</span>
            <h2>Highlighted work</h2>
            <p>One large 16:9 card (left) plus up to five 9:16 verticals: the first two sit top-right, the next three fill the bottom row.</p>
          </div>
        </div>
        <div className="grid2">
          <div>
            <div className="fld" style={{ marginBottom: 16 }}>
              <label>Big card (16:9 — showreel / VSL)</label>
              <select className="selectbox" value={featured.bigCard || ""} onChange={e => onChange({ ...featured, bigCard: e.target.value })} style={{ width: "100%" }}>
                <option value="">— none —</option>
                {videos.map(v => <option key={v.file} value={v.file}>{(v.title || v.file)} — {v.file}</option>)}
              </select>
            </div>
            <label className="fld" style={{ marginBottom: 8 }}><span style={{ fontSize: ".74rem", fontWeight: 600, color: "var(--muted)" }}>Vertical cards (max 5)</span></label>
            <SlotList tokens={featured.verticalCards || []} byFile={byFile} max={5}
              onChange={list => onChange({ ...featured, verticalCards: list })} emptyHint="No vertical cards yet." />
          </div>
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Live preview</span>
            <BentoPreview featured={featured} byFile={byFile} />
          </div>
        </div>
      </div>
    );
  }

  const CASE_META = {
    vrss: { name: "VRSS Fightgear", note: "Three vertical cards beside the case copy.", orient: false },
    alex: { name: "Alex", note: "A gallery of up to ~8 vertical cards.", orient: false },
    scm: { name: "SCM", note: "Mix orientations — typically 1 horizontal + 2 vertical. Toggle V/H per item.", orient: true },
  };

  function CasesPanel({ cases, videos, byFile, onChange }) {
    return (
      <div>
        {["vrss", "alex", "scm"].map(key => {
          const m = CASE_META[key];
          return (
            <div className="panel" key={key}>
              <div className="panel__head">
                <div>
                  <span className="eyebrow">Case study · {key}</span>
                  <h2>{m.name}</h2>
                  <p>{m.note}</p>
                </div>
              </div>
              <SlotList tokens={cases[key] || []} byFile={byFile} orient={m.orient}
                onChange={list => onChange(key, list)} emptyHint="No videos assigned to this case study." />
            </div>
          );
        })}
      </div>
    );
  }

  function HeroPanel({ hero, videos, mediaReady, onChange, onReady }) {
    const showreels = videos.filter(v => v.cat === "showreel");
    const isImg = window.AdminConst.isImageSrc(hero);
    const [custom, setCustom] = useState(false);
    const preset = !custom && (isImg ? false : showreels.some(v => hero === `showreel/${v.file}.mp4`));

    return (
      <div>
        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="eyebrow">Top of homepage</span>
              <h2>Hero media</h2>
              <p>The big showreel area at the top of the page. Point it at a video (muted looping teaser, click = play with sound) or a still image.</p>
            </div>
          </div>
          <div className="fld" style={{ marginBottom: 14 }}>
            <label>Source</label>
            <div className="segfull">
              <button className={cls(!custom && "is-active")} onClick={() => setCustom(false)}>Pick a showreel</button>
              <button className={cls(custom && "is-active")} onClick={() => setCustom(true)}>Custom path</button>
            </div>
          </div>
          {!custom ? (
            <div className="fld">
              <label>Showreel video</label>
              <select className="selectbox" value={preset ? hero : ""} onChange={e => onChange(e.target.value)} style={{ width: "100%" }}>
                <option value="">— choose —</option>
                {showreels.map(v => <option key={v.file} value={`showreel/${v.file}.mp4`}>{v.title || v.file} (showreel/{v.file}.mp4)</option>)}
              </select>
              <div className="hint">Place the file at <code>videos/showreel/&lt;file&gt;.mp4</code> (+ optional <code>.jpg</code> poster).</div>
            </div>
          ) : (
            <div className="fld">
              <label>Custom media path</label>
              <input type="text" className="mono" value={hero || ""} onChange={e => onChange(e.target.value)} placeholder="showreel/img_main.png" />
              <div className="hint">Relative to <code>videos/</code>. Image extensions render as a still; video extensions render a player. Current: <b>{isImg ? "image" : "video"}</b>.</div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="eyebrow">Global</span>
              <h2>Media ready</h2>
              <p>While off, the site stays in clean placeholder mode and makes no requests for missing local files (no console errors). Bunny Stream videos always play. Flip on once your posters / mp4s are in place.</p>
            </div>
          </div>
          <div className="switch">
            <div className="switch__txt"><b>MEDIA_READY</b><small>Load real posters, local mp4s and the hero media.</small></div>
            <window.Toggle on={mediaReady} onChange={onReady} />
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { SlotList, FeaturedPanel, CasesPanel, HeroPanel, BentoPreview });
})();
