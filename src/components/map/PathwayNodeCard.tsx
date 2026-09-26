import { useState } from "react";
import { Link } from "react-router-dom";
import { copy } from "../../locales";
import type { PathwayContextBlock, PathwayNode } from "../../types/pathway";
import { characterById, personaIdForEndNode } from "../../data/characterProfiles";

function normalizeContext(
  context: PathwayNode["context"],
): PathwayContextBlock[] {
  if (!context) return [];
  return Array.isArray(context) ? context : [context];
}

function ContextBlock({ block }: { block: PathwayContextBlock }) {
  return (
    <div className="context-block">
      <strong>{block["resource-type"]}:</strong>
      {block.notes ? <p className="context-notes">{block.notes}</p> : null}
      {block.resources?.length ? (
        <div className="context-resources">
          {block.resources.map((resource) => (
            <a
              key={resource.link}
              href={resource.link}
              className="resource-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              {resource.name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  node: PathwayNode;
  visible: boolean;
  isOptionSelected: (toId: string) => boolean;
  onToggleOption: (toId: string) => void;
};

export function PathwayNodeCard({
  node,
  visible,
  isOptionSelected,
  onToggleOption,
}: Props) {
  const [contextOpen, setContextOpen] = useState(false);
  const labels = copy.pathwayNodeCard;
  const personaId =
    node.type === "end" ? personaIdForEndNode(node.id) : null;
  const persona = personaId ? characterById(personaId) : null;
  const contextBlocks = persona ? [] : normalizeContext(node.context);
  const toggleLabel = contextOpen ? labels.hideResources : labels.resources;
  const [readMorePrefix, readMoreSuffix] = labels.readMoreAbout.split("{name}");

  return (
    <div
      id={node.id}
      className={`node-anchor ${node.type}${persona ? " has-persona" : ""}${visible ? " visible" : ""}`.trim()}
      style={{ left: node.x, top: node.y }}
      {...(!visible ? { inert: "" } : {})}
      aria-hidden={!visible}
    >
      <div className={`node node-card${persona ? " node-card-result" : ""}`}>
        {persona ? (
          <>
            <header className="persona-front-meta">
              <span className="persona-code">{persona.code}</span>
              <span className="persona-stamp" aria-hidden="true">
                DA
              </span>
            </header>
            <div className="result-portrait">
              <span className="persona-portrait-label">Portrait</span>
              {persona.image ? (
                <img
                  src={persona.image}
                  alt={persona.imageAlt}
                  width={280}
                  height={280}
                />
              ) : null}
              <span className="result-stamp">{node.tag ?? labels.defaultTag}</span>
            </div>
            <div className="result-body">
              <div className="node-title">{persona.name}</div>
              <p className="result-subtitle">{persona.subtitle}</p>
              <div className="node-desc">{node.desc}</div>
              <Link
                to={`/characters#${persona.id}`}
                className={`character-read-more character-read-more--${persona.id}`}
              >
                <span className="character-read-more-line">
                  {readMorePrefix.trim()}
                </span>
                <span className="character-read-more-name">
                  {persona.name}
                  {readMoreSuffix}
                </span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="node-header">
              <span className="node-tag">{node.tag ?? labels.defaultTag}</span>
            </div>
            <div className="node-title">{node.title}</div>
            <div className="node-desc">{node.desc}</div>
          </>
        )}

        {contextBlocks.length ? (
          <>
            <button
              type="button"
              className="context-toggle"
              onClick={() => setContextOpen((o) => !o)}
            >
              {toggleLabel}
            </button>
            <div
              className={`node-context${contextOpen ? " active" : ""}`.trim()}
            >
              {contextBlocks.map((block) => (
                <ContextBlock
                  key={block["resource-type"]}
                  block={block}
                />
              ))}
            </div>
          </>
        ) : null}

        {node.options?.length ? (
          <div className="node-edge-options" role="group" aria-label={node.title}>
            {node.options.map((opt) => {
              const tid = opt.target;
              if (!tid) return null;
              const selected = isOptionSelected(tid);
              return (
                <button
                  key={`${node.id}-${opt.label}-${tid}`}
                  type="button"
                  data-target={tid}
                  className={`opt-btn${selected ? " selected" : ""}`.trim()}
                  onClick={() => onToggleOption(tid)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
