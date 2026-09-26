import { useEffect, useRef, useState, type FormEvent } from "react";
import { copy } from "../../locales";
import { CHARACTERS, type CharacterId } from "../../data/characterProfiles";
import {
  LIMITS,
  hasContent,
  submitResourceSuggestion,
} from "../../lib/feedback/submitResourceSuggestion";

type Status = "editing" | "sending" | "sent" | "error";

/** "Share a resource" form, opened from each guide's "Want to add a tip?" section. */
export function ResourceSuggestionDialog({
  open,
  sourceGuide,
  onClose,
}: {
  open: boolean;
  sourceGuide: CharacterId | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = copy.resourceSuggestion;
  const [links, setLinks] = useState("");
  const [notes, setNotes] = useState("");
  const [archetypes, setArchetypes] = useState<CharacterId[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("editing");

  const suggestion = { links, notes, archetypes, sourceGuide };
  const canSubmit = hasContent(suggestion) && status !== "sending";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setLinks("");
      setNotes("");
      setArchetypes([]);
      setHoneypot("");
      setStatus("editing");
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const toggleArchetype = (id: CharacterId) =>
    setArchetypes((current) =>
      current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
    );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    // Bots fill in the hidden field; pretend it worked and save nothing.
    if (honeypot) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    try {
      await submitResourceSuggestion(suggestion);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="event-popup resource-popup"
      aria-labelledby="resource-popup-title"
      onClose={onClose}
      onClick={(e) => {
        // Clicking the dimmed backdrop closes it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="event-popup-inner">
        <button
          type="button"
          className="event-popup-close"
          aria-label={text.close}
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="resource-popup-title" className="event-popup-title">
          {status === "sent" ? text.thanksTitle : text.title}
        </h2>

        {status === "sent" ? (
          <>
            <p className="event-popup-text">{text.thanksBody}</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              {text.done}
            </button>
          </>
        ) : (
          <form className="resource-form" onSubmit={onSubmit} noValidate>
            <p className="event-popup-text resource-form-intro">{text.intro}</p>

            <label className="resource-field">
              <span className="resource-label">{text.linksLabel}</span>
              <textarea
                rows={2}
                maxLength={LIMITS.links}
                placeholder={text.linksPlaceholder}
                value={links}
                onChange={(e) => setLinks(e.target.value)}
              />
            </label>

            <label className="resource-field">
              <span className="resource-label">{text.notesLabel}</span>
              <textarea
                rows={4}
                maxLength={LIMITS.notes}
                placeholder={text.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <fieldset className="resource-field resource-archetypes">
              <legend className="resource-label">{text.archetypesLabel}</legend>
              <div className="resource-archetype-options">
                {CHARACTERS.map((character) => {
                  const checked = archetypes.includes(character.id);
                  return (
                    <label
                      key={character.id}
                      className={`track-pill track-pill-${character.id} resource-archetype${checked ? " is-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArchetype(character.id)}
                      />
                      {character.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Honeypot: hidden from people, tempting to bots. */}
            <label className="resource-honeypot" aria-hidden="true">
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>

            {status === "error" ? (
              <p className="resource-error" role="alert">
                {text.error}
              </p>
            ) : null}

            <div className="resource-actions">
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                {status === "sending" ? text.sending : text.submit}
              </button>
              {!hasContent(suggestion) ? (
                <span className="resource-hint">{text.needOneField}</span>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
