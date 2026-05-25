import { useState } from "react";
import TipTapEditor from "../../../../components/ui/editor/JoditTextEditor";

// ── Page CSS ──────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #f4f6f9;
    font-family: 'DM Sans', sans-serif;
    color: #111827;
    min-height: 100vh;
  }

  /* Top nav */
  .cp-nav {
    position: sticky; top: 0; z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e2e6ed;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
    height: 56px;
  }
  .cp-nav-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 20px; color: #111827;
    letter-spacing: -0.02em;
    text-decoration: none;
  }
  .cp-nav-logo span { color: #3b6ef8; }
  .cp-nav-actions { display: flex; gap: 10px; align-items: center; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 16px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; border: none;
    transition: background 0.15s, color 0.15s, transform 0.1s;
    text-decoration: none;
  }
  .btn:active { transform: scale(0.98); }
  .btn-ghost {
    background: transparent; color: #6b7280;
    border: 1.5px solid #e2e6ed;
  }
  .btn-ghost:hover { background: #f8f9fb; color: #374151; }
  .btn-primary {
    background: #3b6ef8; color: #fff;
    box-shadow: 0 1px 3px rgba(59,110,248,0.3);
  }
  .btn-primary:hover { background: #2d5ee0; }
  .btn-primary:disabled { background: #93b3fc; cursor: not-allowed; box-shadow: none; }
  .btn-danger-ghost { background: transparent; color: #ef4444; border: 1.5px solid #fecaca; }
  .btn-danger-ghost:hover { background: #fff5f5; }

  /* Layout */
  .cp-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    max-width: 1120px;
    margin: 32px auto;
    padding: 0 24px 60px;
  }
  @media (max-width: 860px) {
    .cp-layout { grid-template-columns: 1fr; }
    .cp-sidebar { order: -1; }
  }

  /* Card */
  .card {
    background: #fff;
    border: 1px solid #e2e6ed;
    border-radius: 12px;
    padding: 24px;
  }
  .card + .card { margin-top: 16px; }
  .card-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 16px;
  }

  /* Form fields */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field + .field { margin-top: 18px; }
  .field label {
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.03em; color: #6b7280;
  }
  .field input,
  .field select,
  .field textarea {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid #e2e6ed;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: #111827;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    resize: vertical;
  }
  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #3b6ef8;
    box-shadow: 0 0 0 3px rgba(59,110,248,0.1);
  }
  .field input::placeholder,
  .field textarea::placeholder { color: #c4cad4; }

  /* Title field (bigger) */
  .field-title input {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; font-weight: 400;
    padding: 10px 14px;
    letter-spacing: -0.01em;
  }

  /* Tag input */
  .tags-wrap {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 8px 10px;
    border: 1.5px solid #e2e6ed;
    border-radius: 8px;
    cursor: text;
    min-height: 42px;
    align-items: center;
  }
  .tags-wrap:focus-within { border-color: #3b6ef8; box-shadow: 0 0 0 3px rgba(59,110,248,0.1); }
  .tag-chip {
    display: inline-flex; align-items: center; gap: 4px;
    background: #eef2ff; color: #3b6ef8;
    border-radius: 20px; padding: 2px 10px;
    font-size: 12px; font-weight: 500;
  }
  .tag-chip button {
    background: none; border: none; cursor: pointer;
    color: #93b3fc; font-size: 14px; line-height: 1;
    padding: 0; display: flex; align-items: center;
  }
  .tag-chip button:hover { color: #3b6ef8; }
  .tag-input {
    border: none !important; outline: none !important;
    padding: 2px 4px !important;
    font-size: 13px !important;
    min-width: 80px; flex: 1;
    box-shadow: none !important;
    background: transparent !important;
  }

  /* Cover image */
  .cover-drop {
    border: 2px dashed #e2e6ed;
    border-radius: 10px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    position: relative;
    overflow: hidden;
  }
  .cover-drop:hover { border-color: #3b6ef8; background: #f7f9ff; }
  .cover-drop img {
    width: 100%; height: 140px;
    object-fit: cover; border-radius: 8px;
  }
  .cover-drop-text {
    font-size: 13px; color: #9ca3af;
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
  }
  .cover-drop-text svg { color: #c4cad4; }

  /* Status badge */
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block;
  }
  .status-dot.draft   { background: #f59e0b; }
  .status-dot.ready   { background: #10b981; }

  /* Preview panel */
  .preview-panel {
    background: #fff;
    border: 1px solid #e2e6ed;
    border-radius: 12px;
    overflow: hidden;
  }
  .preview-panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    display: flex; align-items: center; justify-content: space-between;
  }
  .preview-panel-title {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;
  }
  .preview-content {
    padding: 16px;
    font-family: 'DM Serif Display', serif;
    font-size: 14px; line-height: 1.7; color: #374151;
    max-height: 340px; overflow-y: auto;
  }
  .preview-content h1 { font-size: 1.5em; margin-bottom: 0.4em; color: #111827; }
  .preview-content h2 { font-size: 1.2em; margin-bottom: 0.3em; color: #111827; }
  .preview-content p  { margin-bottom: 0.6em; }
  .preview-content ul, .preview-content ol { padding-left: 1.4em; margin-bottom: 0.6em; }
  .preview-content blockquote {
    border-left: 3px solid #3b6ef8; padding: 4px 12px;
    color: #6b7280; font-style: italic; background: #f7f9ff;
    border-radius: 0 4px 4px 0; margin-bottom: 0.6em;
  }
  .preview-empty {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: #c4cad4;
    font-style: italic; text-align: center; padding: 24px 0;
  }

  /* Character counter */
  .char-hint { font-size: 11px; color: #c4cad4; text-align: right; margin-top: 4px; }
  .char-hint.warn { color: #f59e0b; }
  .char-hint.over { color: #ef4444; }

  /* Toast */
  .toast {
    position: fixed; bottom: 28px; right: 28px;
    background: #111827; color: #fff;
    padding: 12px 20px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: slide-in 0.25s ease;
    z-index: 999;
  }
  .toast.success { background: #059669; }
  .toast.error   { background: #dc2626; }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Divider */
  .divider { height: 1px; background: #f3f4f6; margin: 20px 0; }

  /* Scrollbar */
  .preview-content::-webkit-scrollbar { width: 4px; }
  .preview-content::-webkit-scrollbar-track { background: #f9fafb; }
  .preview-content::-webkit-scrollbar-thumb { background: #e2e6ed; border-radius: 2px; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORIES = ["Technology", "Design", "Business", "Health", "Travel", "Food", "Education", "Other"];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreatePost() {
  const [title, setTitle]       = useState("");
  const [excerpt, setExcerpt]   = useState("");
  const [content, setContent]   = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus]     = useState<"draft" | "ready">("draft");
  const [toast, setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const excerptMax = 160;
  const excerptLen = excerpt.length;

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, "");
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleCoverUrl() {
    const url = prompt("Image URL লিখুন:");
    if (url) setCoverUrl(url);
  }

  async function handlePublish() {
    if (!title.trim()) { showToast("Title দিন!", "error"); return; }
    if (!content || stripHtml(content).length < 10) { showToast("Content লিখুন!", "error"); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("ready");
    setSubmitting(false);
    showToast("✓ Post published successfully!");
  }

  function handleDraft() {
    setStatus("draft");
    showToast("Draft saved.");
  }

  const readyToPublish = title.trim().length > 0 && stripHtml(content).length > 10;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      <style>{PAGE_CSS}</style>

      {/* Nav */}
      <nav className="cp-nav">
        <a className="cp-nav-logo" href="#">
          write<span>.</span>ly
        </a>
        <div className="cp-nav-actions">
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif" }}>
            <span className={`status-dot ${status}`} />
            {status === "draft" ? "Draft" : "Published"}
          </span>
          <button className="btn btn-ghost" onClick={handleDraft}>Save Draft</button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={!readyToPublish || submitting}
          >
            {submitting ? "Publishing…" : "Publish Post"}
          </button>
        </div>
      </nav>

      {/* Layout */}
      <div className="cp-layout">

        {/* ── Main column ── */}
        <div>
          {/* Title */}
          <div className="card">
            <div className="field field-title">
              <label>Post Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a compelling title…"
                maxLength={120}
              />
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>Excerpt <span style={{ color: "#c4cad4", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description shown in listings…"
                maxLength={excerptMax}
              />
              <div className={`char-hint${excerptLen > excerptMax * 0.9 ? excerptLen >= excerptMax ? " over" : " warn" : ""}`}>
                {excerptLen}/{excerptMax}
              </div>
            </div>
          </div>

          {/* Rich text editor */}
          <div className="card" style={{ padding: "20px 20px 16px" }}>
            <div className="card-title">Post Content</div>
            <TipTapEditor
              placeholder="Start writing your post…"
              minHeight={320}
              maxWidth="100%"
              onChange={setContent}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="cp-sidebar">

          {/* Cover image */}
          <div className="card">
            <div className="card-title">Cover Image</div>
            <div className="cover-drop" onClick={handleCoverUrl}>
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="cover" onError={() => setCoverUrl("")} />
                  <button
                    className="btn btn-danger-ghost"
                    style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
                    onClick={(e) => { e.stopPropagation(); setCoverUrl(""); }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="cover-drop-text">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Click to add cover image</span>
                  <span style={{ fontSize: 11 }}>Paste an image URL</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <div className="card-title">Post Settings</div>

            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Tags <span style={{ color: "#c4cad4", fontWeight: 400 }}>(max 5, press Enter)</span></label>
              <div className="tags-wrap" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
                {tags.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                    <button onClick={() => removeTag(t)}>×</button>
                  </span>
                ))}
                <input
                  className="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder={tags.length < 5 ? "Add tag…" : ""}
                  disabled={tags.length >= 5}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="preview-panel">
            <div className="preview-panel-header">
              <span className="preview-panel-title">Live Preview</span>
              <span style={{ fontSize: 11, color: "#c4cad4", fontFamily: "'DM Sans',sans-serif" }}>
                {stripHtml(content).split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <div className="preview-content">
              {title && <h1>{title}</h1>}
              {excerpt && <p style={{ color: "#6b7280", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{excerpt}</p>}
              {title && excerpt && <div className="divider" />}
              {content
                ? <div dangerouslySetInnerHTML={{ __html: content }} />
                : <div className="preview-empty">Content will appear here…</div>
              }
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}