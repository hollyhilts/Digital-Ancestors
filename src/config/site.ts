/**
 * Site settings you can edit, commit and push. Vercel redeploys on push.
 * Keep this file small and plain: one line per setting, with a comment.
 */
export type SiteConfig = {
  quiz: {
    /** Questions asked before we check whether the score has settled. */
    minQuestions: number;
    /**
     * Tiebreaker limit. If the score is still exactly on a line after
     * minQuestions, up to this many questions are asked in total.
     */
    maxQuestions: number;
    /** Also mix in the 2 optional extra questions from the question bank. */
    includeOptionalQuestions: boolean;
  };
  eventPopup: {
    /** Show the "see it in person" pop-up to first-time visitors. */
    enabled: boolean;
    /** Stop showing it after this date (YYYY-MM-DD, end of day local time). */
    showUntil: string;
    /**
     * Remembers who has already seen it. Change this (e.g. "-v2") to show
     * the pop-up again to everyone, say for a new event.
     */
    storageKey: string;
  };
};

export const siteConfig: SiteConfig = {
  quiz: {
    minQuestions: 6,
    maxQuestions: 8,
    includeOptionalQuestions: false,
  },
  eventPopup: {
    enabled: true,
    showUntil: "2026-10-08",
    storageKey: "da-event-popup-stackt-2026",
  },
};
