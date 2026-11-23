import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ageOf } from './graph.js';
import { makeRadialLayout, projectFocus, radialBounds, radialContext, radialPath } from './radial.js';
import './radial.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const midpoint = (box) => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });
const byTime = (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt) || a.id.localeCompare(b.id);

export function RadialMap({ agents, allLinks, liveLinks, activeAgents, driverId, focus, now, onSelect, onClear, renderBubble }) {
  const id = useId();
  const viewport = useRef(null);
  const drag = useRef(null);
  const previousCamera = useRef(null);
  const anchor = useRef(driverId);
  const desiredCenter = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [customZoom, setCustomZoom] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [revealContext, setRevealContext] = useState(false);
  const layout = useMemo(() => makeRadialLayout(agents, allLinks, driverId), [agents, allLinks, driverId]);

  useLayoutEffect(() => {
    const node = viewport.current;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  const { points, primary, branches, parent } = layout;
  const activeIds = new Set(activeAgents.map((agent) => agent.id));
  const fit = (box) => Math.min(width / (box.right - box.left), height / (box.bottom - box.top));
  const fullFits = fit(radialBounds(points, activeIds)) >= .72;
  const idle = radialContext(layout, liveLinks, activeIds, undefined, fullFits, false);
  const idleBounds = radialBounds(points, idle.visible);
  const zoom = customZoom ?? clamp(fit(idleBounds), .64, 1.05);
  const { visible, tucked, impacts, level } = radialContext(layout, liveLinks, activeIds, focus?.id, fullFits,
    focus ? revealContext : showAll);
  const projection = focus ? projectFocus(layout, liveLinks, visible, focus.id) : null;
  const canvasPoints = projection?.points ?? points;
  const bounds = radialBounds(canvasPoints, canvasPoints.keys());
  const padX = width / 2;
  const padY = height / 2;
  const worldWidth = (bounds.right - bounds.left) * zoom + width;
  const worldHeight = (bounds.bottom - bounds.top) * zoom + height;
  const camera = { left: bounds.left, top: bounds.top, width, height, zoom };
  const overviewCenter = midpoint(idleBounds);

  function center(point) {
    if (!point) return;
    const node = viewport.current;
    node.scrollLeft = (point.x - camera.left) * zoom;
    node.scrollTop = (point.y - camera.top) * zoom;
  }

  useLayoutEffect(() => {
    if (!width || !height) return;
    const node = viewport.current;
    const previous = previousCamera.current;
    let target = desiredCenter.current;
    if (focus && focus.id !== previous?.focusId) {
      anchor.current = focus.id;
      target = points.get(focus.id);
      const box = radialBounds(canvasPoints, projection.front, 64);
      const fitted = clamp(Math.min(
        width / (2 * Math.max(target.x - box.left, box.right - target.x)),
        height / (2 * Math.max(target.y - box.top, box.bottom - target.y)),
      ), .39, 1.05);
      if (Math.abs(fitted - zoom) > .015) {
        setCustomZoom(fitted);
        desiredCenter.current = target;
        previousCamera.current = { ...camera, focusId: focus.id };
        return;
      }
    } else if (!focus && previous?.focusId) {
      target = points.get(anchor.current);
    } else if (!target && previous) {
      target = {
        x: node.scrollLeft / previous.zoom + previous.left,
        y: node.scrollTop / previous.zoom + previous.top,
      };
    }
    center(target ?? overviewCenter);
    previousCamera.current = { ...camera, focusId: focus?.id };
    desiredCenter.current = null;
  }, [width, height, zoom, focus?.id, bounds.left, bounds.top]);

  function updateZoom(change) {
    setCustomZoom(clamp(zoom * change, .2, 1.7));
  }

  function resetCamera() {
    if (focus) {
      center(points.get(focus.id));
      return;
    }
    const target = anchor.current !== driverId ? points.get(anchor.current) : overviewCenter;
    if (customZoom === null || customZoom === clamp(fit(idleBounds), .64, 1.05)) {
      center(target);
    } else {
      desiredCenter.current = target;
    }
    setCustomZoom(null);
  }

  function fitMap() {
    const box = radialBounds(canvasPoints, projection?.front ?? visible);
    const target = midpoint(box);
    const fitted = clamp(fit(box), .2, 1.05);
    if (fitted === zoom) center(target);
    else desiredCenter.current = target;
    setCustomZoom(fitted);
  }

  function toggleFocus(agentId) {
    if (focus?.id === agentId) {
      setShowAll(true);
      onClear();
      return;
    }
    setShowAll(false);
    setRevealContext(false);
    onSelect(agentId);
  }

  function keyPan(event) {
    if (event.key === 'Escape' && focus) {
      event.preventDefault();
      toggleFocus(focus.id);
      return;
    }
    if (event.target !== event.currentTarget) return;
    const step = event.shiftKey ? 160 : 54;
    const directions = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = directions[event.key];
    if (move) {
      event.preventDefault();
      viewport.current.scrollLeft += move[0];
      viewport.current.scrollTop += move[1];
    } else if (['+', '=', '-', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') resetCamera();
      else updateZoom(event.key === '-' ? 1 / 1.2 : 1.2);
    }
  }

  function startDrag(event) {
    if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('button')) return;
    const node = viewport.current;
    drag.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
  }

  function moveDrag(event) {
    if (!drag.current) return;
    const node = viewport.current;
    node.scrollLeft = drag.current.left + drag.current.x - event.clientX;
    node.scrollTop = drag.current.top + drag.current.y - event.clientY;
  }

  function stopDrag(event) {
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  const edgeLevel = (link) => {
    if (!focus) return 1;
    if (projection.rewired.has(link.id)) return 2;
    if (link.from === focus.id || link.to === focus.id) return 3;
    return Math.min(level(link.from), level(link.to));
  };
  const screenPoint = ({ x, y }) => ({ x: x - bounds.left, y: y - bounds.top });
  const shownLinks = liveLinks.filter(({ from, to }) => visible.has(from) && visible.has(to))
    .sort((a, b) => edgeLevel(a) - edgeLevel(b) || byTime(a, b));
  const groups = [...new Set(activeAgents.flatMap(({ id }) => [primary.get(id), branches.get(id)].filter(Boolean)))];
  const focusGroup = focus && primary.get(focus.id);
  const focusBranch = focus && branches.get(focus.id);
  const anchorName = agents.find((agent) => agent.id === anchor.current)?.name;

  return (
    <div className="br-radial">
      <div className="br-radial-tools">
        <div className="br-radial-zoom" role="group" aria-label="Canvas controls">
          <button type="button" aria-label="Zoom out" disabled={zoom <= .2} onClick={() => updateZoom(1 / 1.2)}>−</button>
          <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label="Zoom in" disabled={zoom >= 1.7} onClick={() => updateZoom(1.2)}>+</button>
          <button type="button" onClick={resetCamera}>Recenter</button>
          <button type="button" onClick={fitMap}>Fit map</button>
        </div>
        <button type="button" className="br-radial-all" aria-pressed={showAll && !focus} onClick={() => {
          if (focus) {
            toggleFocus(focus.id);
          } else {
            setShowAll(!showAll);
          }
        }}>Show all</button>
        {(focus ? revealContext || visible.size < activeIds.size : !fullFits)
          && <button type="button" aria-pressed={focus ? revealContext : showAll}
            onClick={() => focus ? setRevealContext(!revealContext) : setShowAll(!showAll)}>
            {(focus ? revealContext : showAll) ? 'See less' : `See more (+${activeIds.size - visible.size})`}
          </button>}
      </div>

      <div className="br-radial-readout" aria-live="polite">
        <span><strong>{visible.size} of {activeIds.size}</strong> agents · {shownLinks.length} links</span>
        <span>{focus ? <><strong>{focus.name}</strong> in focus</> : anchorName && anchor.current !== driverId ? `Anchor: ${anchorName}` : 'Driver overview'}</span>
      </div>
      <p id={`${id}-hint`} className="br-radial-help">Drag or scroll to pan. Select a bubble to focus. Select it again for the full map.</p>
      <div ref={viewport} className="br-radial-viewport" tabIndex={0} role="region" aria-label="Radial agent canvas"
        aria-describedby={`${id}-hint`} onKeyDown={keyPan}>
        <div className="br-radial-world" style={{ width: worldWidth, height: worldHeight }}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag}
          onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
          {width > 0 && <div className="br-radial-plane" style={{ left: padX, top: padY,
            width: bounds.right - bounds.left, height: bounds.bottom - bounds.top, transform: `scale(${zoom})` }}>
            <svg className="br-radial-edges" aria-hidden="true" width="100%" height="100%">
              <defs><marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="9" markerHeight="9"
                markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="context-stroke" strokeWidth="1.4" /></marker></defs>
              {shownLinks.map((link) => {
                const owns = parent.get(link.to) === link.from && link.kind === 'delegation';
                const color = (owns ? primary.get(link.to) : branches.get(link.from) ?? primary.get(link.from)).color;
                const destination = projection?.rewired.get(link.id);
                const path = radialPath(screenPoint(canvasPoints.get(link.from)), screenPoint(canvasPoints.get(destination ?? link.to)), !owns);
                return <path key={link.id} d={path} data-radial-edge={link.id} data-kind={link.kind} data-portal={destination || undefined} data-priority={edgeLevel(link)}
                  data-age={ageOf(link.updatedAt, now).className} data-status={link.status} style={{ '--br-crew': color }}
                  markerEnd={`url(#${id}-arrow)`} />;
              })}
            </svg>
            {layout.ordered.filter(({ id }) => visible.has(id)).map((agent) => renderBubble(agent, screenPoint(canvasPoints.get(agent.id)), {
              level: level(agent.id), primary: primary.get(agent.id), branch: branches.get(agent.id),
              secondary: [...impacts.get(agent.id).values()], tucked: tucked.get(agent.id) ?? 0, onClick: toggleFocus,
            }))}
            {projection?.portals.map(({ key, destination, count }) => {
              const agent = agents.find(({ id }) => id === destination);
              const point = screenPoint(canvasPoints.get(key));
              return <button key={key} type="button" className="br-radial-portal" data-portal-for={destination}
                style={{ left: point.x, top: point.y, '--br-crew': primary.get(destination).color }}
                aria-label={`Open ${agent.name}, linked copy for ${count} ${count === 1 ? 'connection' : 'connections'}`}
                onClick={() => {
                  toggleFocus(destination);
                  requestAnimationFrame(() => {
                    const original = [...(viewport.current?.querySelectorAll('[data-agent]') ?? [])]
                      .find((button) => button.dataset.agent === destination);
                    original?.focus({ preventScroll: true });
                  });
                }}>
                <span><b aria-hidden="true">↪</b> {agent.name}</span>
                <small>{count} {count === 1 ? 'link' : 'links'} · copy</small>
              </button>;
            })}
          </div>}
        </div>
      </div>

      <div className="br-radial-key">
        {focusGroup && <div className="br-radial-impact">
          <span><strong>Primary</strong> {focusGroup.name}</span>
          {focusBranch && focusBranch !== focusGroup && <span><strong>Leads</strong> {focusBranch.name}</span>}
          {[...impacts.get(focus.id).values()].length > 0 && <span><strong>Connected work</strong> {[...impacts.get(focus.id).values()].map((group) => group.name).join(', ')}</span>}
        </div>}
        <div className="br-radial-swatch-row" aria-label="Crew colors">
          {groups.map((group) => <span key={group.key}><i style={{ background: group.color }} />{group.name}</span>)}
        </div>
        {!!projection?.portals.length && <p>Linked copies at the border open the same agent.</p>}
        <p>Core color shows who created the agent. Outer bands show the crew it leads and connected work. Dashed arrows mark dependencies.</p>
      </div>
    </div>
  );
}
