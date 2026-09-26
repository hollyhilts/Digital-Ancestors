import type { CharacterId } from "../../data/characterProfiles";

export type ResourceSuggestion = {
  /** One or more links, one per line. */
  links: string;
  notes: string;
  /** Guides the visitor thinks this fits. Empty means "didn't say". */
  archetypes: CharacterId[];
  /** The guide page the popup was opened from. */
  sourceGuide: CharacterId | null;
};

export const LIMITS = { links: 2000, notes: 4000 } as const;

/** Same rule as the database check: at least one field filled. */
export function hasContent(s: ResourceSuggestion): boolean {
  return (
    s.links.trim() !== "" || s.notes.trim() !== "" || s.archetypes.length > 0
  );
}

/**
 * Save a suggestion. Not connected yet: this only logs it.
 * TODO: insert into Supabase `resource_suggestions` (docs/feedback-form-plan.md).
 */
export async function submitResourceSuggestion(
  suggestion: ResourceSuggestion,
): Promise<void> {
  console.info("[resource suggestion] not saved yet:", suggestion);
}
