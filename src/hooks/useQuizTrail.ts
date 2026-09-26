import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FIRST_QUESTION_ID } from "../lib/quiz/bank";
import { getQuizRules } from "../lib/quiz/rules";
import {
  addAnswer,
  closeCallWith,
  finalPosition,
  isFinished,
  newScore,
  pickNextQuestion,
  type QuizCharacter,
  type QuizPosition,
  type QuizRules,
} from "../lib/quiz/engine";

/**
 * Quiz map layout — edit these, then refresh.
 *
 *   PLOT_UNIT  map pixels per point of score. One point of Boundaries /
 *              Possibilities moves the next card this far sideways; one point
 *              of Me / Us moves it this far up or down.
 *   CARD_WIDTH must match .qm-card in global.css.
 *
 * A card is centred on (score.x * PLOT_UNIT, -score.y * PLOT_UNIT), so the
 * trail is the plot: the quadrant map revealed at the end uses the same
 * coordinates and the dot lands at the visitor's exact score.
 */
export const PLOT_UNIT = 440;
export const CARD_WIDTH = 340;

/** Cards closer than this (both ways) overlap, so the newer one is nudged. */
const COLLIDE_X = CARD_WIDTH + 50;
const COLLIDE_Y = 380;
const MIN_SCALE = 0.03;
const MAX_SCALE = 2.2;
/** The result card's width : height ratio at its normal (unscaled)
 * proportions — only used by fitPlot as a rough guess for the very first
 * frame, before the result's real size is measured and reported via
 * setResultDims. Must match `.qm-result .node-anchor`'s max-width in
 * global.css relative to the card's natural height. */
const RESULT_ASPECT = 0.62;
/** Gap between the (shrunk) quadrant map and the result card, as a fraction
 * of the quadrant's own (shrunk) size — scales with it, rather than being a
 * flat map-pixel amount that all but disappears once the quadrant is small
 * and the camera is zoomed out. */
export const RESULT_GAP_RATIO = 0.35;
const DESKTOP_MIN_WIDTH = 881;
const REVEAL_DELAY_MS = 350;
const RESULT_DELAY_MS = 1800;

export type QuizStep = {
  /** Unique per position and question. */
  key: string;
  questionId: string;
  selected: number | null;
  /** Running score when this question was asked. */
  scoreX: number;
  scoreY: number;
  /** Centre of the card, in map pixels. */
  x: number;
  y: number;
};

export type QuizResultState = {
  position: QuizPosition;
  closeCall: QuizCharacter | null;
};

type View = { x: number; y: number; s: number };

function makeStep(
  questionId: string,
  scoreX: number,
  scoreY: number,
  index: number,
  others: QuizStep[],
): QuizStep {
  const base = { x: scoreX * PLOT_UNIT, y: -scoreY * PLOT_UNIT };
  const offsets: [number, number][] = [
    [0, 0],
    [0.6, 0.55],
    [-0.6, 0.55],
    [0.6, -0.55],
    [-0.6, -0.55],
    [1.1, 0],
    [-1.1, 0],
    [0, 1],
  ];
  const free = offsets
    .map(([dx, dy]) => ({ x: base.x + dx * PLOT_UNIT, y: base.y + dy * PLOT_UNIT }))
    .find((p) =>
      others.every(
        (o) => Math.abs(o.x - p.x) >= COLLIDE_X || Math.abs(o.y - p.y) >= COLLIDE_Y,
      ),
    );
  const at = free ?? base;
  return {
    key: `quiz-${index}-${questionId}`,
    questionId,
    selected: null,
    scoreX,
    scoreY,
    x: at.x,
    y: at.y,
  };
}

function scoreOf(steps: QuizStep[], rules: QuizRules) {
  return steps.reduce(
    (score, step) =>
      step.selected === null
        ? score
        : addAnswer(score, rules, step.questionId, step.selected),
    newScore(),
  );
}

/** Half the side of the (square) quadrant map. */
function plotExtent(steps: QuizStep[], position: QuizPosition | null): number {
  let max = 4;
  for (const step of steps) {
    max = Math.max(max, Math.abs(step.scoreX), Math.abs(step.scoreY));
  }
  if (position) max = Math.max(max, Math.abs(position.x), Math.abs(position.y));
  return (Math.ceil(max) + 1) * PLOT_UNIT;
}

export function useQuizTrail() {
  const rules = useMemo(() => getQuizRules(), []);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setViewState] = useState<View>({ x: 0, y: 0, s: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [animating, setAnimating] = useState(false);

  const [steps, setSteps] = useState<QuizStep[]>(() => [
    makeStep(FIRST_QUESTION_ID, 0, 0, 0, []),
  ]);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const [result, setResult] = useState<QuizResultState | null>(null);
  const resultRef = useRef(result);
  resultRef.current = result;
  const [resultVisible, setResultVisible] = useState(false);
  /** The result's real rendered size (card + close-call note + actions, in
   * map pixels), once QuizMapSection has measured it. Read synchronously by
   * fitPlot, so it's a plain ref rather than state — null until measured,
   * which fitPlot approximates around in the meantime. */
  const resultDimsRef = useRef<{ w: number; h: number } | null>(null);
  const setResultDims = useCallback((w: number, h: number) => {
    resultDimsRef.current = { w, h };
  }, []);
  /** How much smaller the quadrant map renders than its true geometric size —
   * ratio of the card's portrait image to the whole card, so the quadrant
   * ends up the same size as the portrait. Read synchronously by fitPlot,
   * like resultDimsRef; defaults to 1 (no shrink) until measured. */
  const quadrantScaleRef = useRef(1);
  const setQuadrantScale = useCallback((scale: number) => {
    quadrantScaleRef.current = scale;
  }, []);

  /** Same answers on the same path give the same next question. */
  const memo = useRef(new Map<string, string>());

  const timeouts = useRef<number[]>([]);
  const animTimer = useRef<number | undefined>(undefined);

  const clearScheduled = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      clearScheduled();
      window.clearTimeout(animTimer.current);
    },
    [clearScheduled],
  );

  /** Move the camera. `animate` glides; otherwise it jumps (dragging, zooming). */
  const setView = useCallback(
    (x: number, y: number, s: number, animate = false) => {
      window.clearTimeout(animTimer.current);
      setAnimating(animate);
      setViewState({ x, y, s });
      if (animate) {
        animTimer.current = window.setTimeout(() => setAnimating(false), 1000);
      }
    },
    [],
  );

  const baseScale = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return 1;
    return Math.min(1, (el.clientWidth - 28) / CARD_WIDTH);
  }, []);

  /** Centre a card in the viewport. */
  const centerOn = useCallback(
    (step: QuizStep, options: { resetZoom?: boolean; animate?: boolean } = {}) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = options.resetZoom
        ? baseScale()
        : Math.max(viewRef.current.s, baseScale());
      setView(
        rect.width / 2 - s * step.x,
        rect.height / 2 - s * step.y,
        s,
        options.animate ?? true,
      );
    },
    [baseScale, setView],
  );

  /** Pull the camera back to fit the quadrant map and, on desktop, the result
   * (card + close-call note + actions). The result sits dead centre in the
   * viewport, at "real size"; the quadrant — shrunk to match the card's own
   * portrait image, see setQuadrantScale — is just a small detail that fits
   * in the space left of it, down to the viewport's edges. */
  const fitPlot = useCallback(
    (fitSteps: QuizStep[], position: QuizPosition, animate: boolean) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const desktop = window.innerWidth >= DESKTOP_MIN_WIDTH;
      const extent = plotExtent(fitSteps, position);
      const margin = 20;
      const quadrant = 2 * extent;

      if (!desktop) {
        // Mobile/tablet: the result renders below the map, in normal flow —
        // just fit the quadrant square on its own, at its true size (it isn't
        // shrunk to match the card outside of the desktop layout).
        const s = Math.max(
          MIN_SCALE,
          Math.min(1, (rect.width - 2 * margin) / quadrant, (rect.height - 2 * margin) / quadrant),
        );
        setView(rect.width / 2, rect.height / 2, s, animate);
        return;
      }

      // Before the result's real size is measured (see setResultDims /
      // setQuadrantScale), fall back to an approximation: a card as tall as
      // the quadrant, at its normal width:height ratio, quadrant unshrunk.
      const dims = resultDimsRef.current ?? { w: quadrant * RESULT_ASPECT, h: quadrant };
      const quadScale = quadrantScaleRef.current;
      const quadVisual = quadrant * quadScale;
      const gap = quadVisual * RESULT_GAP_RATIO;
      const sWidth = (rect.width / 2 - margin) / (quadVisual + gap + dims.w / 2);
      const sHeight = (rect.height - 2 * margin) / Math.max(quadVisual, dims.h);
      const s = Math.max(MIN_SCALE, Math.min(1, sWidth, sHeight));
      // The result's anchor sits at map x = extent * quadScale + gap, y =
      // -extent (see QuizMapSection); its own centre is offset from that by
      // half its measured size. Put that centre at the viewport's centre.
      const resultMidX = extent * quadScale + gap + dims.w / 2;
      const resultMidY = -extent + dims.h / 2;
      setView(rect.width / 2 - s * resultMidX, rect.height / 2 - s * resultMidY, s, animate);
    },
    [setView],
  );

  const reveal = useCallback(
    (finalSteps: QuizStep[], position: QuizPosition) => {
      setResult({ position, closeCall: closeCallWith(position) });
      later(() => fitPlot(finalSteps, position, true), REVEAL_DELAY_MS);
      // A second, corrective fit shortly after: if the viewport's layout
      // (e.g. a scrollbar appearing/disappearing) hadn't settled yet when the
      // first fit measured it, this catches up without a visible jump.
      later(() => fitPlot(finalSteps, position, false), REVEAL_DELAY_MS + 500);
      later(() => setResultVisible(true), RESULT_DELAY_MS);
    },
    [fitPlot, later],
  );

  const choose = useCallback(
    (stepKey: string, optionIndex: number) => {
      const current = stepsRef.current;
      const index = current.findIndex((s) => s.key === stepKey);
      if (index < 0) return;
      const wasRevealed = resultRef.current !== null;

      // Same answer again: go to the question it already led to.
      if (current[index].selected === optionIndex && index < current.length - 1) {
        centerOn(current[index + 1]);
        return;
      }

      clearScheduled();
      setResultVisible(false);
      setResult(null);
      resultDimsRef.current = null;

      // A different answer replaces everything after it: one trail only.
      const kept = current
        .slice(0, index + 1)
        .map((s, i) => (i === index ? { ...s, selected: optionIndex } : s));
      const score = scoreOf(kept, rules);

      if (isFinished(score, rules)) {
        setSteps(kept);
        reveal(kept, finalPosition(score));
        return;
      }

      const memoKey = kept.map((s) => `${s.questionId}:${s.selected}`).join("|");
      let questionId = memo.current.get(memoKey);
      if (!questionId) {
        questionId = pickNextQuestion(score, rules).id;
        memo.current.set(memoKey, questionId);
      }
      const next = makeStep(questionId, score.x, score.y, kept.length, kept);
      setSteps([...kept, next]);
      centerOn(next, { resetZoom: wasRevealed });
    },
    [centerOn, clearScheduled, reveal, rules],
  );

  /** From the result: undo the last answer and carry on from that question. */
  const changeLastAnswer = useCallback(() => {
    const current = stepsRef.current;
    if (!current.length) return;
    clearScheduled();
    setResultVisible(false);
    setResult(null);
    resultDimsRef.current = null;
    const updated = current.map((s, i) =>
      i === current.length - 1 ? { ...s, selected: null } : s,
    );
    setSteps(updated);
    centerOn(updated[updated.length - 1], { resetZoom: true });
  }, [centerOn, clearScheduled]);

  const restart = useCallback(() => {
    clearScheduled();
    memo.current.clear();
    setResult(null);
    resultDimsRef.current = null;
    setResultVisible(false);
    const first = makeStep(FIRST_QUESTION_ID, 0, 0, 0, []);
    setSteps([first]);
    centerOn(first, { resetZoom: true });
  }, [centerOn, clearScheduled]);

  /** "Find me": back to the current question, or the whole plot once finished. */
  const recenter = useCallback(
    (animate = true) => {
      const current = stepsRef.current;
      const done = resultRef.current;
      if (done) fitPlot(current, done.position, animate);
      else centerOn(current[current.length - 1], { animate });
    },
    [centerOn, fitPlot],
  );

  useLayoutEffect(() => {
    centerOn(stepsRef.current[0], { resetZoom: true, animate: false });
  }, [centerOn]);

  // If the window changes width while the plot is showing, fit it again.
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) < 20) return;
      lastWidth = window.innerWidth;
      if (resultRef.current) recenter(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recenter]);

  /** Zoom by a factor around a point in the viewport. */
  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      const { x, y, s } = viewRef.current;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor));
      const k = next / s;
      setView(cx - (cx - x) * k, cy - (cy - y) * k, next, false);
    },
    [setView],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(factor, rect.width / 2, rect.height / 2);
    },
    [zoomAt],
  );

  const extent = useMemo(
    () => plotExtent(steps, result?.position ?? null),
    [steps, result],
  );

  return {
    rules,
    steps,
    result,
    resultVisible,
    view,
    viewRef,
    animating,
    viewportRef,
    extent,
    setView,
    zoomAt,
    zoomBy,
    choose,
    changeLastAnswer,
    restart,
    recenter,
    setResultDims,
    setQuadrantScale,
  };
}
