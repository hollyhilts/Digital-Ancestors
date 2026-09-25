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
};

export const siteConfig: SiteConfig = {
  quiz: {
    minQuestions: 6,
    maxQuestions: 8,
    includeOptionalQuestions: false,
  },
};
