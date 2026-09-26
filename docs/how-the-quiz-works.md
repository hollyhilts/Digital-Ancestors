# How the Digital Ancestors Quiz Works

## What the quiz does

The quiz asks artists 6 to 8 short questions about AI, and each answer moves a dot around a map. Where the dot ends up shows which of four characters they're closest to: **Guardian**, **Scribe**, **Trailblazer** or **Weaver**. No answer is right or wrong. The result describes an attitude, not a skill level.

## The two scales

Every answer moves you on two scales at once:

- **Across (x): Boundaries ↔ Possibilities.** Is your instinct to protect your work, or to see what AI can do?
- **Up and down (y): Me ↔ Us.** Are you thinking about your own practice, or about artists as a community?

Each answer carries a small score on both scales, usually between −2 and +2. For example, "How can I make one?" scores +2 toward Possibilities and −1 toward Me. The quiz adds up these scores as you go, and the running total is where your dot sits. Each question's answers are designed to balance out, so no character is favored.

## How questions are chosen

Everyone starts with the same question about AI-generated posters. After that, the quiz adapts to you:

1. It checks which scale it's **least sure about**. Each scale needs at least two questions that really test it, and after that it picks the scale whose total is closest to zero.
2. It picks a random unasked question that mainly tests that scale.

So two people rarely see the exact same questions, but everyone gets enough questions on both scales to place them fairly. The bank currently has 12 questions, plus 2 optional ones that are switched off.

## When the quiz stops

The quiz asks at least **6 questions**. After that, it stops as soon as your dot isn't sitting exactly on either line. If you're perfectly balanced on a scale, it keeps asking tiebreaker questions, up to **8 in total**.

## Your result

The two lines split the map into four quadrants, one per character:

| | **Boundaries** (left) | **Possibilities** (right) |
| --- | --- | --- |
| **Us** (top) | Scribe | Weaver |
| **Me** (bottom) | Guardian | Trailblazer |

If you're still exactly on a line after 8 questions, your dot leans the way your most recent answer on that scale leaned. If your dot lands within 1 point of a line, the result also names the neighboring character as a close call, because you're partly both.

---

The code behind this lives in [`src/lib/quiz/`](../src/lib/quiz/): `engine.ts` (scoring and question picking), `bank.ts` (questions and answer scores), and the min/max question settings in [`src/config/site.ts`](../src/config/site.ts).
