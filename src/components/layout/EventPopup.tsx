import { useEffect, useRef } from "react";
import { siteConfig } from "../../config/site";
import { copy } from "../../locales";

const { enabled, showUntil, storageKey } = siteConfig.eventPopup;

function hasSeenPopup(): boolean {
  try {
    return window.localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
}

function markPopupSeen() {
  try {
    window.localStorage.setItem(storageKey, new Date().toISOString());
  } catch {
    // Storage blocked (private mode etc.) — the pop-up may show again next visit.
  }
}

function eventIsOver(): boolean {
  return new Date() > new Date(`${showUntil}T23:59:59`);
}

/** One-time "see it in person" notice for first-time visitors. */
export function EventPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = copy.eventPopup;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !enabled || eventIsOver() || hasSeenPopup()) return;
    // Mark as seen as soon as it opens, so a reload doesn't show it twice.
    markPopupSeen();
    dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="event-popup"
      aria-labelledby="event-popup-title"
      onClick={(e) => {
        // Clicking the dimmed backdrop closes it.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="event-popup-inner">
        <button
          type="button"
          className="event-popup-close"
          aria-label={text.close}
          onClick={close}
        >
          ×
        </button>
        <h2 id="event-popup-title" className="event-popup-title">
          {text.title}
        </h2>
        <p className="event-popup-text">{text.body}</p>
        <a
          className="btn btn-primary"
          href={text.moreInfoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text.moreInfo} ↗
        </a>
      </div>
    </dialog>
  );
}
