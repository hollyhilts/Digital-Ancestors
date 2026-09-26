import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { copy } from "../../locales";
import { RESULT_GAP_RATIO, useQuizTrail } from "../../hooks/useQuizTrail";
import { SectionHeader } from "../sections/SectionHeader";
import { MapLegend } from "../map/MapLegend";
import { QuizMarkers, QuizPlotLayer } from "./QuizPlotLayer";
import { QuizResult } from "./QuizResult";

/** Tracks a min-width media query so we can render the result differently above it. */
function useIsDesktop(minWidth: number): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= minWidth,
  );
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [minWidth]);
  return isDesktop;
}

/** A single right-angle bend with a rounded corner, like the old map's elbow connectors. */
function elbowPathD(x1: number, y1: number, x2: number, y2: number, radius = 20): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    return `M${x1} ${y1} L${x2} ${y2}`;
  }
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const r = Math.min(radius, Math.abs(dx), Math.abs(dy));
  const cornerX = x2;
  const cornerY = y1;
  return [
    `M${x1} ${y1}`,
    `L${cornerX - sx * r} ${cornerY}`,
    `Q${cornerX} ${cornerY} ${cornerX} ${cornerY + sy * r}`,
    `L${x2} ${y2}`,
  ].join(" ");
}

const DESKTOP_MIN_WIDTH = 881;

/**
 * The quiz map. Each answer draws a line in the direction it pushes you and the
 * next question appears where the line ends. The quadrant map with your dot is
 * revealed after the last question.
 */
export function QuizMapSection() {
  const quiz = useQuizTrail();
  const { viewportRef, viewRef, setView, zoomAt } = quiz;
  const resultRef = useRef<HTMLElement>(null);
  const revealed = quiz.result !== null;
  const isDesktop = useIsDesktop(DESKTOP_MIN_WIDTH);

  // Scale the reused result card (kept at its normal, undistorted proportions)
  // up until its height matches the full quadrant map's height (2x extent),
  // instead of stretching it. Measured off the card itself, not the close-call
  // note or change/restart buttons below it, so the card is the thing that's
  // actually "life-size" against the quadrant. The full stack's real,
  // now-scaled size (card + note + actions) is then reported to the trail
  // hook so it can centre the whole thing precisely — see fitPlot.
  //
  // The quadrant map itself is then shrunk back down (via quadrantScale) to
  // match the size of the card's own portrait image, so it reads as a small
  // detail beside the "real size" card rather than competing with it.
  const resultScaleRef = useRef<HTMLDivElement>(null);
  const [resultScale, setResultScale] = useState(1);
  const [quadrantScale, setQuadrantScale] = useState(1);
  useLayoutEffect(() => {
    const el = resultScaleRef.current;
    if (!el || !quiz.result) return;
    const measure = () => {
      const card = el.querySelector<HTMLElement>(".node-card");
      const portrait = el.querySelector<HTMLElement>(".result-portrait");
      const natural = card?.offsetHeight ?? 0;
      if (natural <= 0) return;
      const scale = (quiz.extent * 2) / natural;
      setResultScale(scale);
      quiz.setResultDims(el.offsetWidth * scale, el.offsetHeight * scale);
      if (portrait?.offsetHeight) {
        const quadScale = portrait.offsetHeight / natural;
        setQuadrantScale(quadScale);
        quiz.setQuadrantScale(quadScale);
      }
      quiz.recenter(false);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [quiz.result, quiz.extent, quiz.setResultDims, quiz.setQuadrantScale, quiz.recenter]);

  // Drag to pan, wheel / pinch to zoom.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; vx: number; vy: number } | null = null;
    let pinchDistance: number | null = null;

    const isControl = (target: EventTarget | null) =>
      target instanceof Element && target.closest("button, a, .qm-result") !== null;
    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const startDrag = (x: number, y: number) => {
      const v = viewRef.current;
      drag = { x, y, vx: v.x, vy: v.y };
      el.classList.add("is-dragging");
    };

    const onDown = (e: PointerEvent) => {
      if (isControl(e.target)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      if (pointers.size === 1) startDrag(e.clientX, e.clientY);
      else if (pointers.size === 2) {
        drag = null;
        pinchDistance = distance();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinchDistance) {
        const rect = el.getBoundingClientRect();
        const [a, b] = [...pointers.values()];
        const d = distance();
        zoomAt(d / pinchDistance, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
        pinchDistance = d;
        return;
      }
      if (drag && pointers.size === 1) {
        setView(
          drag.vx + e.clientX - drag.x,
          drag.vy + e.clientY - drag.y,
          viewRef.current.s,
          false,
        );
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      pinchDistance = null;
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        startDrag(p.x, p.y);
      } else if (pointers.size === 0) {
        drag = null;
        el.classList.remove("is-dragging");
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sensitivity = e.ctrlKey ? 0.01 : 0.0015;
      zoomAt(Math.exp(-e.deltaY * sensitivity), e.clientX - rect.left, e.clientY - rect.top);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [viewportRef, viewRef, setView, zoomAt]);

  // On phones the result sits below the map: bring it into view when it appears.
  useEffect(() => {
    if (!quiz.resultVisible || window.innerWidth >= DESKTOP_MIN_WIDTH) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [quiz.resultVisible]);

  const worldStyle = {
    transform: `translate(${quiz.view.x}px, ${quiz.view.y}px) scale(${quiz.view.s})`,
    "--inv": (1 / quiz.view.s).toFixed(4),
  } as CSSProperties;

  // The quadrant's right edge once shrunk, plus a gap sized relative to it —
  // must match fitPlot's own math in useQuizTrail.
  const quadVisual = quiz.extent * 2 * quadrantScale;
  const resultAnchorLeft = quiz.extent * quadrantScale + quadVisual * RESULT_GAP_RATIO;

  const { trail, controls } = copy.map;

  return (
    <section id="map" className="section" aria-labelledby="map-heading">
      <SectionHeader
        kicker={copy.map.kicker}
        title={copy.map.title}
        titleId="map-heading"
        body={copy.map.body}
      />

      <div className="map-shell-header">
        <div className="map-shell-badges">
          <div className="map-shell-badge">{copy.map.badges.pan}</div>
          <div className="map-shell-badge">{copy.map.badges.zoom}</div>
          <div className="map-shell-badge">{trail.badgePaths}</div>
        </div>
      </div>

      <div className="qm-stage">
        <div
          ref={viewportRef}
          className={`qm-viewport${revealed ? " is-done" : ""}`}
          aria-label={trail.mapLabel}
        >
          <div
            className={`qm-world${quiz.animating ? " is-animating" : ""}`}
            style={worldStyle}
          >
            <div
              className="qm-map-content"
              style={
                isDesktop && revealed ? { transform: `scale(${quadrantScale})` } : undefined
              }
            >
              <QuizPlotLayer
                extent={quiz.extent}
                revealed={revealed}
                mine={quiz.result?.position.character ?? null}
              />
              <svg className="qm-lines" aria-hidden="true">
                {quiz.steps.slice(0, -1).map((from, i) => {
                  const to = quiz.steps[i + 1];
                  const length = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
                  return (
                    <path
                      key={`${from.key}>${to.key}`}
                      className="qm-line"
                      d={elbowPathD(from.x, from.y, to.x, to.y)}
                      style={{ strokeDasharray: length, "--L": length } as CSSProperties}
                    />
                  );
                })}
              </svg>
              {quiz.steps.map((step, i) => {
                const question = quiz.rules.bank.find((q) => q.id === step.questionId);
                if (!question) return null;
                return (
                  <div key={step.key} className="qm-pos" style={{ left: step.x, top: step.y }}>
                    <div
                      className={`qm-card${revealed ? " is-gone" : ""}`}
                      {...(revealed ? { inert: "" } : {})}
                    >
                      <div className="qm-kicker">
                        {i === 0
                          ? trail.startTag
                          : trail.questionTag.replace("{n}", String(i + 1))}
                      </div>
                      <h3 className="qm-title">{question.title}</h3>
                      <div className="qm-answers">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={option.label}
                            type="button"
                            className={`qm-answer${step.selected === optionIndex ? " is-selected" : ""}`}
                            onClick={() => quiz.choose(step.key, optionIndex)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <QuizMarkers
                stops={quiz.steps.map((s) => ({ key: s.key, x: s.x, y: s.y }))}
                position={quiz.result?.position ?? null}
                revealed={revealed}
              />
            </div>
            {isDesktop && quiz.result ? (
              <div
                className="qm-result-anchor"
                style={{
                  left: resultAnchorLeft,
                  top: -quiz.extent,
                }}
              >
                <div
                  ref={resultScaleRef}
                  className="qm-result-scale"
                  style={{ transform: `scale(${resultScale})`, transformOrigin: "top left" }}
                >
                  <QuizResult
                    result={quiz.result}
                    visible={quiz.resultVisible}
                    onChangeLast={quiz.changeLastAnswer}
                    onRestart={quiz.restart}
                    resultRef={resultRef}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="qm-controls">
            <button
              type="button"
              className="qm-btn"
              onClick={() => quiz.zoomBy(1.3)}
              aria-label={controls.zoomIn}
              title={controls.zoomIn}
            >
              +
            </button>
            <button
              type="button"
              className="qm-btn"
              onClick={() => quiz.zoomBy(1 / 1.3)}
              aria-label={controls.zoomOut}
              title={controls.zoomOut}
            >
              −
            </button>
            <button type="button" className="qm-btn" onClick={() => quiz.recenter()}>
              {trail.findMe}
            </button>
            <button
              type="button"
              className="qm-btn"
              onClick={quiz.restart}
              aria-label={controls.reset}
              title={controls.reset}
            >
              ↻
            </button>
          </div>
          <div className="qm-hint">{trail.hint}</div>
        </div>

        {!isDesktop ? (
          <QuizResult
            result={quiz.result}
            visible={quiz.resultVisible}
            onChangeLast={quiz.changeLastAnswer}
            onRestart={quiz.restart}
            resultRef={resultRef}
          />
        ) : null}
      </div>

      <MapLegend />
    </section>
  );
}
