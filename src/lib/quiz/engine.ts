import { FIRST_QUESTION_ID, type QuizQuestion } from "./bank";

/** Same ids as CharacterId in data/characterProfiles (kept local so this file has no browser-only imports). */
export type QuizCharacter = "guardian" | "scribe" | "trailblazer" | "weaver";

export type QuizAnswer = {
  questionId: string;
  optionIndex: number;
  x: number;
  y: number;
};

/** Everything answered so far, plus the running totals. */
export type QuizScore = {
  answers: QuizAnswer[];
  x: number;
  y: number;
};

export type QuizRules = {
  bank: QuizQuestion[];
  /** Questions asked before we check whether the score has settled. */
  minQuestions: number;
  /** Hard stop, even if the score is still exactly on a line. */
  maxQuestions: number;
};

export type QuizPosition = {
  x: number;
  y: number;
  character: QuizCharacter;
};

type Axis = "x" | "y";

export function newScore(): QuizScore {
  return { answers: [], x: 0, y: 0 };
}

function findQuestion(rules: QuizRules, id: string): QuizQuestion {
  const question = rules.bank.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown quiz question: ${id}`);
  return question;
}

export function addAnswer(
  score: QuizScore,
  rules: QuizRules,
  questionId: string,
  optionIndex: number,
): QuizScore {
  const option = findQuestion(rules, questionId).options[optionIndex];
  if (!option) throw new Error(`Unknown option ${optionIndex} for ${questionId}`);
  return {
    answers: [
      ...score.answers,
      { questionId, optionIndex, x: option.x, y: option.y },
    ],
    x: score.x + option.x,
    y: score.y + option.y,
  };
}

/** How far apart a question's answers sit on one scale. */
function spread(question: QuizQuestion, axis: Axis): number {
  const values = question.options.map((o) => o[axis]);
  return Math.max(...values) - Math.min(...values);
}

/**
 * Which scale is least clear so far? A scale needs at least two questions that
 * really measure it; after that, whichever total is closest to zero.
 */
export function axisToAsk(score: QuizScore, rules: QuizRules): Axis {
  const coverage = { x: 0, y: 0 };
  for (const answer of score.answers) {
    const question = findQuestion(rules, answer.questionId);
    for (const axis of ["x", "y"] as const) {
      if (spread(question, axis) >= 2) coverage[axis] += 1;
    }
  }
  const needy = (["x", "y"] as const).filter((axis) => coverage[axis] < 2);
  if (needy.length === 1) return needy[0];
  const pool = needy.length ? needy : (["x", "y"] as const).slice();
  return pool.sort(
    (a, b) =>
      Math.abs(score[a]) - Math.abs(score[b]) ||
      coverage[a] - coverage[b] ||
      (a === "x" ? -1 : 1),
  )[0];
}

/** Done once enough questions are answered and neither total sits exactly on a line. */
export function isFinished(score: QuizScore, rules: QuizRules): boolean {
  const asked = score.answers.length;
  if (asked >= rules.maxQuestions) return true;
  return asked >= rules.minQuestions && score.x !== 0 && score.y !== 0;
}

/**
 * The next question: every unasked question that mainly measures the scale we
 * need is equally likely.
 */
export function pickNextQuestion(
  score: QuizScore,
  rules: QuizRules,
  random: () => number = Math.random,
): QuizQuestion {
  if (score.answers.length === 0) return findQuestion(rules, FIRST_QUESTION_ID);
  const asked = new Set(score.answers.map((a) => a.questionId));
  const axis = axisToAsk(score, rules);
  const other: Axis = axis === "x" ? "y" : "x";
  const candidates = rules.bank.filter(
    (q) => !asked.has(q.id) && q.id !== FIRST_QUESTION_ID,
  );
  let pool = candidates.filter(
    (q) => spread(q, axis) >= 2 && spread(q, axis) >= spread(q, other),
  );
  if (!pool.length) pool = candidates;
  if (!pool.length) throw new Error("The quiz bank ran out of questions");
  return pool[Math.floor(random() * pool.length)];
}

export function characterForPosition(x: number, y: number): QuizCharacter {
  if (x < 0) return y < 0 ? "guardian" : "scribe";
  return y < 0 ? "trailblazer" : "weaver";
}

/**
 * Where the visitor finishes. If a total is still exactly zero, lean the way
 * the most recent answer on that scale leaned (a half point, so the dot sits
 * just off the line).
 */
export function finalPosition(score: QuizScore): QuizPosition {
  const lean = (axis: Axis): number => {
    if (score[axis] !== 0) return score[axis];
    for (let i = score.answers.length - 1; i >= 0; i -= 1) {
      const sign = Math.sign(score.answers[i][axis]);
      if (sign !== 0) return sign * 0.5;
    }
    return 0.5;
  };
  const x = lean("x");
  const y = lean("y");
  return { x, y, character: characterForPosition(x, y) };
}

/** When the dot is within a point of a line, name the neighbouring character. */
export function closeCallWith(position: QuizPosition): QuizCharacter | null {
  const { x, y } = position;
  if (Math.min(Math.abs(x), Math.abs(y)) > 1) return null;
  return Math.abs(x) <= Math.abs(y)
    ? characterForPosition(-x, y)
    : characterForPosition(x, -y);
}
