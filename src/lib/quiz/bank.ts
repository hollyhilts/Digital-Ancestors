/**
 * Question bank for the dynamic quiz map.
 *
 * Every answer nudges the visitor on two scales:
 *   x  Boundaries (negative)  <->  Possibilities (positive)
 *   y  Me (negative)          <->  Us (positive)
 * The running total decides which way the trail on the map heads and, at the
 * end, which quadrant (character) the visitor lands in:
 *   Guardian    x < 0, y < 0   (Boundaries + Me)         bottom-left
 *   Scribe      x < 0, y > 0   (Boundaries + Us)         top-left
 *   Trailblazer x > 0, y < 0   (Possibilities + Me)      bottom-right
 *   Weaver      x > 0, y > 0   (Possibilities + Us)      top-right
 *
 * Editing tips
 *  - Answer values are small whole numbers, usually -2 to +2.
 *  - Keep each question balanced: its answers should average out to about
 *    zero on both scales, otherwise the quiz starts favouring one character.
 *  - Re-check the odds after any change: `npm run audit:quiz`.
 *  - Answers marked "added for balance" were not in the original quiz.
 */
export type QuizOption = {
  label: string;
  /** Boundaries (-) <-> Possibilities (+) */
  x: number;
  /** Me (-) <-> Us (+) */
  y: number;
};

export type QuizQuestion = {
  id: string;
  title: string;
  options: QuizOption[];
  /** Only used when siteConfig.quiz.includeOptionalQuestions is true. */
  optional?: boolean;
};

/** Everyone starts here. */
export const FIRST_QUESTION_ID = "poster";

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "poster",
    title: "AI-generated posters everywhere. What are your thoughts?",
    options: [
      { label: "How can I make one?", x: 2, y: -1 },
      { label: "Ugh, hire artists.", x: -2, y: 1 },
      { label: "There's no originality.", x: -1, y: -1 },
      { label: "Could this help more artists get seen?", x: 1, y: 1 }, // added for balance
    ],
  },
  {
    id: "data",
    title: "A company wants to use your photos and posts to make its AI smarter. Your response?",
    options: [
      { label: "Yuck, the thought of giving big corp my data.", x: -2, y: -1 },
      { label: "I'll decide case by case.", x: 1, y: -1 },
      { label: "Who gets the benefits?", x: 1, y: 2 },
    ],
  },
  {
    id: "credibility",
    title: "Do you think that artwork loses credibility if AI was involved?",
    options: [
      { label: "Depends how it was used.", x: 1, y: 0 },
      { label: "Yes, always.", x: -2, y: 0 },
      { label: "Depends on MANY factors.", x: -1, y: 1 },
      { label: "No. The work speaks for itself.", x: 2, y: -1 }, // added for balance
    ],
  },
  {
    id: "style",
    title: "You see AI-generated artwork in the style of a famous artist. How do you respond?",
    options: [
      { label: "How do I make one of those?", x: 2, y: -1 },
      { label: "Did the artist 'OK' this?", x: -2, y: 1 },
    ],
  },
  {
    id: "jobs",
    title: "How tired are you of hearing \"AI will take our jobs\"?",
    options: [
      { label: "Very, and I'm over it.", x: 1, y: -1 },
      { label: "Tired, but ignoring won't help anyone.", x: 1, y: 2 },
      { label: "Not tired. It's a real worry.", x: -2, y: -1 }, // added for balance
    ],
  },
  {
    id: "label",
    title: "Instagram now puts an \"AI info\" label on some posts. Thoughts?",
    options: [
      { label: "Good. I want to see this feature more.", x: -1, y: 1 },
      { label: "Fine. Doesn't change whether I like the post.", x: 1, y: -2 },
      { label: "Good start. What does it mean though?", x: 0, y: 1 },
    ],
  },
  {
    id: "tech",
    title: "What are your thoughts on all these insane tech advancements as of late?",
    options: [
      { label: "Sigh *reminisce on simpler times*.", x: -1, y: 0 },
      { label: "Fascinating, scary, exciting, all at once.", x: 2, y: 1 },
      { label: "Eye roll. Can we touch grass please?", x: -1, y: -1 },
    ],
  },
  {
    id: "show",
    title: "Your favourite show gets a new season written with AI help.",
    options: [
      { label: "I'll watch it and judge the difference.", x: 1, y: -2 },
      { label: "Why didn't they hire more writers?", x: -2, y: 1 },
      { label: "Could this help smaller teams tell more stories?", x: 1, y: 1 }, // added for balance
    ],
  },
  {
    id: "use",
    title: "What do you use AI for today?",
    options: [
      { label: "Nothing.", x: -2, y: 0 },
      { label: "Small stuff, minimally.", x: -1, y: 0 },
      { label: "Whatever I'm curious about this week.", x: 2, y: 0 },
      { label: "A lot. It's part of my everyday workflow.", x: 1, y: 0 }, // added for balance
    ],
  },
  {
    id: "email",
    title: "You're behind on emails. Are you going to get help from AI?",
    options: [
      { label: "Not for me, no.", x: -2, y: 0 },
      { label: "Yes, it's likely.", x: 2, y: 0 },
    ],
  },
  {
    id: "guidelines",
    title: "Your community is talking about shared guidelines for AI in creative practice. How do you show up?",
    options: [
      { label: "Help shape boundaries — this affects all of us.", x: -1, y: 2 },
      { label: "I'd rather manage this in my own practice.", x: 1, y: -2 },
    ],
  },
  {
    id: "field",
    title: "What would make AI development actually work for artists as a whole?",
    options: [
      { label: "Shared protections built by the field, for the field.", x: -1, y: 2 },
      { label: "If the benefits — time, resources, reach — were distributed across the creative community.", x: 1, y: 2 },
      { label: "Stronger individual rights to opt out.", x: -1, y: -2 },
      { label: "Better tools I can use on my own terms.", x: 1, y: -2 }, // added for balance
    ],
  },
  {
    id: "friend",
    optional: true, // new question, not needed for balance; adds variety
    title: "A fellow artist asks whether to let a company train AI on their portfolio. What do you tell them?",
    options: [
      { label: "It's your work, your call.", x: 0, y: -2 },
      { label: "Ask around and see what other artists are doing first.", x: -1, y: 2 },
      { label: "Depends what you'd get out of it.", x: 1, y: 0 },
    ],
  },
  {
    id: "collective",
    optional: true, // new question, not needed for balance; adds variety
    title: "An artist collective is deciding whether to use AI tools for a shared project. What matters most to you?",
    options: [
      { label: "Nobody gets pushed into it. Everyone opts in for themselves.", x: -2, y: -2 },
      { label: "We agree on rules and limits together first.", x: -1, y: 2 },
      { label: "The benefits get shared across the group.", x: 1, y: 2 },
      { label: "We get to experiment and see what happens.", x: 2, y: -2 },
    ],
  },
];
