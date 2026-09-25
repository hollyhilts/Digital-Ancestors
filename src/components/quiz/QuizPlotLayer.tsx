import { characterById } from "../../data/characterProfiles";
import { copy } from "../../locales";
import type { QuizCharacter, QuizPosition } from "../../lib/quiz/engine";
import { PLOT_UNIT } from "../../hooks/useQuizTrail";

type PlotProps = {
  /** Half the side of the quadrant map, in map pixels. */
  extent: number;
  revealed: boolean;
  /** The visitor's quadrant gets the strongest tint. */
  mine: QuizCharacter | null;
};

/**
 * The quadrant map. It stays invisible while the quiz runs and fades in at the
 * end. Its centre is the map origin, where the first question sits.
 */
export function QuizPlotLayer({ extent: e, revealed, mine }: PlotProps) {
  const quads: { id: QuizCharacter; left: number; top: number }[] = [
    { id: "scribe", left: -e, top: -e },
    { id: "weaver", left: 0, top: -e },
    { id: "guardian", left: -e, top: 0 },
    { id: "trailblazer", left: 0, top: 0 },
  ];
  const inset = "calc(14px * var(--inv, 1))";
  const { axis } = copy.map.trail;

  return (
    <div className={`qm-plot${revealed ? " is-on" : ""}`} aria-hidden="true">
      {quads.map((q) => (
        <div
          key={q.id}
          className={`qm-quad qm-quad--${q.id}${mine === q.id ? " is-mine" : ""}`}
          style={{ left: q.left, top: q.top, width: e, height: e }}
        />
      ))}
      <div className="qm-axis" style={{ left: -e, top: 0, width: 2 * e, height: "calc(1.5px * var(--inv, 1))" }} />
      <div className="qm-axis" style={{ left: 0, top: -e, height: 2 * e, width: "calc(1.5px * var(--inv, 1))" }} />
      <span className="qm-quad-name" style={{ left: `calc(${-e}px + ${inset})`, top: `calc(${-e}px + ${inset})` }}>
        {characterById("scribe").name}
      </span>
      <span className="qm-quad-name" style={{ left: `calc(${e}px - ${inset})`, top: `calc(${-e}px + ${inset})`, transform: "translateX(-100%)" }}>
        {characterById("weaver").name}
      </span>
      <span className="qm-quad-name" style={{ left: `calc(${-e}px + ${inset})`, top: `calc(${e}px - ${inset})`, transform: "translateY(-100%)" }}>
        {characterById("guardian").name}
      </span>
      <span className="qm-quad-name" style={{ left: `calc(${e}px - ${inset})`, top: `calc(${e}px - ${inset})`, transform: "translate(-100%, -100%)" }}>
        {characterById("trailblazer").name}
      </span>
      <span className="qm-axis-label" style={{ left: -e, top: 0, marginLeft: "calc(-66px * var(--inv, 1))" }}>
        {axis.boundaries}
      </span>
      <span className="qm-axis-label" style={{ left: e, top: 0, marginLeft: "calc(68px * var(--inv, 1))" }}>
        {axis.possibilities}
      </span>
      <span className="qm-axis-label" style={{ left: 0, top: -e, marginTop: "calc(-34px * var(--inv, 1))" }}>
        {axis.us}
      </span>
      <span className="qm-axis-label" style={{ left: 0, top: e, marginTop: "calc(34px * var(--inv, 1))" }}>
        {axis.me}
      </span>
    </div>
  );
}

type MarkerProps = {
  stops: { key: string; x: number; y: number }[];
  position: QuizPosition | null;
  revealed: boolean;
};

/** Small stops along the trail and the "you are here" dot, shown at the end. */
export function QuizMarkers({ stops, position, revealed }: MarkerProps) {
  return (
    <div className={`qm-markers${revealed ? " is-on" : ""}`} aria-hidden="true">
      {stops.map((stop) => (
        <span key={stop.key} className="qm-stop" style={{ left: stop.x, top: stop.y }} />
      ))}
      {position ? (
        <>
          <span
            className="qm-dot"
            style={{ left: position.x * PLOT_UNIT, top: -position.y * PLOT_UNIT }}
          />
          <span
            className="qm-here"
            style={{ left: position.x * PLOT_UNIT, top: -position.y * PLOT_UNIT }}
          >
            {copy.map.trail.youAreHere}
          </span>
        </>
      ) : null}
    </div>
  );
}
