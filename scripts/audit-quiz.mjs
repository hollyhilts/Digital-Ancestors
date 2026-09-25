/**
 * Balance check for the dynamic quiz. Simulates people answering at random and
 * prints how often each character comes up. A fair quiz is about 25% each.
 *
 *   npm run audit:quiz            (uses the settings in src/config/site.ts)
 *   npm run audit:quiz -- 200000  (number of simulated people)
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const people = Number(process.argv[2]) || 100000;

const entry = `
import { getQuizRules } from "./src/lib/quiz/rules";
import { newScore, addAnswer, pickNextQuestion, isFinished, finalPosition } from "./src/lib/quiz/engine";

function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function run(N) {
  const rules = getQuizRules();
  const random = rng(20240601);
  const names = ["guardian", "scribe", "trailblazer", "weaver"];
  const count = Object.fromEntries(names.map((n) => [n, 0]));
  const asked = {};
  const firstAnswer = {};
  const dots = new Set();
  let sx = 0, sy = 0, questions = 0, onLine = 0;
  for (let n = 0; n < N; n += 1) {
    let score = newScore();
    while (!isFinished(score, rules)) {
      const q = pickNextQuestion(score, rules, random);
      score = addAnswer(score, rules, q.id, Math.floor(random() * q.options.length));
    }
    const end = finalPosition(score);
    count[end.character] += 1;
    sx += end.x; sy += end.y; questions += score.answers.length;
    if (score.x === 0 || score.y === 0) onLine += 1;
    dots.add(score.x + "," + score.y);
    for (const a of score.answers) asked[a.questionId] = (asked[a.questionId] || 0) + 1;
    const f = score.answers[0].optionIndex;
    firstAnswer[f] = firstAnswer[f] || Object.fromEntries(names.map((c) => [c, 0]));
    firstAnswer[f][end.character] += 1;
  }
  return { rules, names, count, asked, firstAnswer, dots: dots.size, sx, sy, questions, onLine, N };
}
`;

const out = await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "error",
});
const code = out.outputFiles[0].text;
const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const r = mod.run(people);

const pct = (v) => `${((v / r.N) * 100).toFixed(1)}%`;
console.log(`\nSimulated ${r.N.toLocaleString()} people answering at random`);
console.log(`Question bank: ${r.rules.bank.length} questions, ${r.rules.minQuestions}-${r.rules.maxQuestions} asked each\n`);
console.log("Who they become (fair = about 25% each)");
for (const name of r.names) console.log(`  ${name.padEnd(12)} ${pct(r.count[name])}`);
console.log(`\nCentre of the map: x ${(r.sx / r.N).toFixed(2)}, y ${(r.sy / r.N).toFixed(2)}  (0, 0 is ideal)`);
console.log(`Average questions asked: ${(r.questions / r.N).toFixed(2)}`);
console.log(`Distinct final positions: ${r.dots}`);
console.log(`Score landed exactly on a line: ${pct(r.onLine)}`);
const first = r.rules.bank[0];
console.log("\nFirst answer -> odds of each character (guardian/scribe/trailblazer/weaver)");
for (const [i, row] of Object.entries(r.firstAnswer)) {
  const total = Object.values(row).reduce((a, b) => a + b, 0);
  console.log(`  ${first.options[i].label.slice(0, 40).padEnd(42)} ${r.names.map((c) => Math.round((row[c] / total) * 100)).join(" / ")}`);
}
console.log("\nHow often each question is asked");
for (const q of r.rules.bank) console.log(`  ${q.id.padEnd(12)} ${pct(r.asked[q.id] || 0)}`);
console.log("");
