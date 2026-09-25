import { siteConfig } from "../../config/site";
import { QUIZ_BANK } from "./bank";
import type { QuizRules } from "./engine";

/** The quiz rules as set in src/config/site.ts. */
export function getQuizRules(): QuizRules {
  const { includeOptionalQuestions, minQuestions, maxQuestions } =
    siteConfig.quiz;
  return {
    bank: QUIZ_BANK.filter((q) => !q.optional || includeOptionalQuestions),
    minQuestions,
    maxQuestions,
  };
}
