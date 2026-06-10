/* ============================================================================
   PARTS.JSX — reusable UI + panels for the video manager.
   All components are attached to window for app.jsx to consume.
   ============================================================================ */
const { useState, useRef, useEffect } = React;

/* ---------- constants ---------- */
const CATS = ["entertainment", "educational", "corporate", "showreel"];
const CAT_LABEL = { entertainment: "Entertainment", educational: "Educational", corporate: "Corporate", showreel: "Showreel" };
const IMG_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const isImageSrc = s => IMG_RE.test(s || "");
const posterPath = v => v.customThumb ? v.customThumb : `videos/${v.cat}/${v.file}.jpg`;
const mediaImgPath = v => (v.src && isImageSrc(v.src)) ? `videos/${v.cat}/${v.src}` : posterPath(v);
const cls = (...a) => a.filter(Boolean).join(" ");

/* ---------- icons ---------- */
const Ic = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>,
  drag: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  up: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>,
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"/></svg>,
  film: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 15h18M8 4v16M16 4v16"/></svg>,
  export: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0-12l4 4m-4-4L8 7"/></svg>,
};

/* ---------- thumbnail loader: tries poster file, else placeholder ---------- */
function Thumb({ v, override, variant }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (override) { setSrc(override); return; }
    if (!v) { setSrc(null); return; }
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) setSrc(img.src); };
    img.onerror = () => { if (alive) setSrc(null); };
    img.src = mediaImgPath(v);
    return () => { alive = false; };
  }, [v && v.file, v && v.cat, v && v.src, v && v.customThumb, override]);
  if (src) return <img src={src} alt="" />;
  return <div className="vc__ph">{Ic.film}</div>;
}

/* ---------- toggle ---------- */
function Toggle({ on, onChange }) {
  return <button type="button" className={cls("toggle", on && "is-on")} onClick={() => onChange(!on)} aria-pressed={on} />;
}

/* =====================================================================
   LIBRARY CARD
   ===================================================================== */
function VideoCard({ v, featuredRole, onEdit, onDup, onDelete, drag }) {
  const isImg = v.src && isImageSrc(v.src);
  const variant = v.cat === "showreel" ? "h" : "v";
  return (
    <article
      className={cls("vc", drag.dragging && "is-dragging", drag.over && "is-over")}
      draggable={drag.enabled}
      onDragStart={drag.onDragStart} onDragOver={drag.onDragOver}
      onDrop={drag.onDrop} onDragEnd={drag.onDragEnd}
    >
      <div className={cls("vc__thumb", variant === "h" && "vc__thumb--h")}>
        <Thumb v={v} variant={variant} />
        <div className="vc__flags">
          {v.autoplay && <span className="flag flag--live">● LIVE</span>}
          {featuredRole && <span className="flag flag--feat">★ {featuredRole}</span>}
          {v.bunny && <span className="flag">BUNNY</span>}
          {isImg && <span className="flag flag--img">IMG</span>}
        </div>
        {drag.enabled && <div className="vc__drag" title="Drag to reorder">{Ic.drag}</div>}
      </div>
      <div className="vc__body">
        <div className="vc__title">{v.title || <span style={{ color: "var(--faint)" }}>Untitled</span>}</div>
        <div className="vc__sub">
          <span className="vc__cat">{CAT_LABEL[v.cat] || v.cat}</span>
          {v.client && <span>· {v.client}</span>}
        </div>
        <div className="vc__id">{v.file}</div>
        <div className="vc__actions">
          <button className="btn btn--soft btn--sm" onClick={onEdit}>{Ic.edit} Edit</button>
          <button className="btn btn--soft btn--sm btn--icon" title="Duplicate" onClick={onDup}>{Ic.copy}</button>
          <button className="btn btn--soft btn--sm btn--icon" title="Delete" onClick={onDelete}>{Ic.trash}</button>
        </div>
      </div>
    </article>
  );
}

/* =====================================================================
   MEDIA TEST MODAL (preview a Bunny embed)
   ===================================================================== */
function MediaTest({ url, onClose }) {
  const sep = url.includes("?") ? "&" : "?";
  return (
    <div className="mscrim" onClick={onClose}>
      <div className="mbox" onClick={e => e.stopPropagation()}>
        <div className="mbox__bar"><button className="btn btn--ghost btn--sm" onClick={onClose}>{Ic.x} Close</button></div>
        <iframe src={url + sep + "autoplay=true"} allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowFullScreen frameBorder="0" />
      </div>
    </div>
  );
}

/* =====================================================================
   THUMBNAIL DROPZONE
   ===================================================================== */
function DropZone({ v, override, onFile, dirHandle, flash }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  const variant = v.cat === "showreel" ? "h" : "v";
  const ext = (v.src && isImageSrc(v.src)) ? v.src : `${v.file}.jpg`;
  const targetPath = `videos/${v.cat}/${ext}`;

  const handle = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    if (dirHandle) {
      try {
        const videosDir = await dirHandle.getDirectoryHandle("videos", { create: true });
        const catDir = await videosDir.getDirectoryHandle(v.cat, { create: true });
        const fileHandle = await catDir.getFileHandle(ext, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        if (flash) flash(`Saved to ${targetPath}`);
      } catch (e) {
        console.error("Failed to save image", e);
        if (flash) flash("Error saving. Try reconnecting folder.");
      }
    }

    const reader = new FileReader();
    reader.onload = () => onFile(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="fld">
      <label>Thumbnail / poster</label>
      <div
        className={cls("dz", over && "is-over")}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
      >
        <div className={cls("dz__prev", variant === "h" && "dz__prev--h")}>
          <Thumb v={v} override={override} variant={variant} />
        </div>
        <small>Drag an image here, or</small>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn--soft btn--sm" onClick={() => inputRef.current.click()}>Choose file</button>
          {override && <button type="button" className="btn btn--soft btn--sm" onClick={() => downloadThumb(override, ext)}>{Ic.download} Save as {ext}</button>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => handle(e.target.files[0])} />
      </div>
      <div className="dz__path" title="Where to place the file">{targetPath}</div>
      <div className="hint">
        {dirHandle ? 
          <span style={{color: "var(--ok)"}}><b>Folder connected!</b> The image will be saved automatically when you drop it.</span> : 
          <React.Fragment>The site loads the poster from this exact path. Drop your image, click <b>Save as</b>, then move the downloaded file into that folder.</React.Fragment>
        }
      </div>
    </div>
  );
}

function downloadThumb(dataUrl, name) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

/* =====================================================================
   VIDEO EDITOR (drawer)
   ===================================================================== */
function VideoEditor({ draft, clients, allFiles, thumb, onThumb, onChange, onTest, onClose, onDelete, onDup, onSave, dirHandle, flash }) {
  const v = draft;
  const isImage = !!(v.src && isImageSrc(v.src));
  const fileTaken = allFiles.some(f => f.file === v.file && f.__orig !== v.__orig);

  const setType = (type) => {
    if (type === "image") onChange({ src: v.src && isImageSrc(v.src) ? v.src : `${v.file}.jpg`, bunny: "", autoplay: false });
    else onChange({ src: "" });
  };

  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Edit video">
        <div className="drawer__head">
          <h2>{v.__isNew ? "New video" : "Edit video"}</h2>
          <button className="closex" onClick={onClose}>{Ic.x}</button>
        </div>

        <div className="drawer__body">
          <div className="fld">
            <label>Title</label>
            <input type="text" value={v.title || ""} onChange={e => onChange({ title: e.target.value })} placeholder="e.g. Brand teaser — fast-cut hook" />
          </div>

          <div className="row2">
            <div className="fld">
              <label>File ID {fileTaken && <span style={{ color: "var(--danger)" }}>· in use</span>}</label>
              <input type="text" className="mono" value={v.file || ""} onChange={e => onChange({ file: e.target.value.replace(/[^a-z0-9_-]/gi, "_").toLowerCase() })} placeholder="ent_5" />
            </div>
            <div className="fld">
              <label>Category</label>
              <select value={v.cat} onChange={e => onChange({ cat: e.target.value })}>
                {CATS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
          </div>

          <div className="row2">
            <div className="fld">
              <label>Client</label>
              <input type="text" list="client-list" value={v.client || ""} onChange={e => onChange({ client: e.target.value })} placeholder="VRSS" />
              <datalist id="client-list">{clients.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="fld">
              <label>Instagram URL</label>
              <input type="url" value={v.instagram || ""} onChange={e => onChange({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
          </div>

          <div className="fld">
            <label>Item type</label>
            <div className="segfull">
              <button className={cls(!isImage && "is-active")} onClick={() => setType("video")}>Video</button>
              <button className={cls(isImage && "is-active")} onClick={() => setType("image")}>Image / GIF</button>
            </div>
          </div>

          {!isImage ? (
            <React.Fragment>
              <div className="fld">
                <label>Bunny Stream embed URL</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="url" className="mono" value={v.bunny || ""} onChange={e => onChange({ bunny: e.target.value })} placeholder="https://iframe.mediadelivery.net/embed/123/abc..." />
                  <button className="btn btn--ghost btn--sm" disabled={!v.bunny} onClick={() => onTest(v.bunny)} title="Preview">{Ic.play}</button>
                </div>
                <div className="hint">Paste the embed link from Bunny (<code>iframe.mediadelivery.net/embed/&lt;lib&gt;/&lt;id&gt;</code>). Leave empty to fall back to a local <code>{v.file}.mp4</code>.</div>
              </div>
              <div className="switch">
                <div className="switch__txt"><b>Autoplay in card</b><small>Loops muted in the grid (compilations / highlight reels). Adds a ● LIVE marker.</small></div>
                <Toggle on={!!v.autoplay} onChange={on => onChange({ autoplay: on })} />
              </div>
            </React.Fragment>
          ) : (
            <div className="fld">
              <label>Image / GIF filename</label>
              <input type="text" className="mono" value={v.src || ""} onChange={e => onChange({ src: e.target.value })} placeholder="ent_4.gif" />
              <div className="hint">Shown as-is (a GIF animates). Place it at <code>videos/{v.cat}/{v.src || "file.gif"}</code>.</div>
            </div>
          )}

          <DropZone v={v} override={thumb} onFile={onThumb} dirHandle={dirHandle} flash={flash} />
          
          <div className="fld" style={{ marginTop: 16 }}>
            <label>Custom Thumbnail URL (optional)</label>
            <input type="url" value={v.customThumb || ""} onChange={e => onChange({ customThumb: e.target.value })} placeholder="https://vz-.../thumbnail_xxxx.jpg" />
            <div className="hint">If provided, this URL overrides the local image and the default Bunny thumbnail.</div>
          </div>
        </div>

        <div className="drawer__foot">
          {!v.__isNew && <button className="btn btn--danger" onClick={onDelete}>{Ic.trash} Delete</button>}
          {!v.__isNew && <button className="btn btn--soft" onClick={onDup}>{Ic.copy} Duplicate</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn--primary" disabled={!v.file || fileTaken} onClick={onSave}>Done</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, {
  AdminConst: { CATS, CAT_LABEL, isImageSrc, posterPath, mediaImgPath, cls },
  Ic, Thumb, Toggle, VideoCard, MediaTest, DropZone, VideoEditor, downloadThumb,
});
