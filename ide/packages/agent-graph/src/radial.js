const turn = Math.PI * 2;
const tones = ['#5943b5', '#08796b', '#af4c33', '#2668a2', '#8c4388', '#8a5c1e', '#397841', '#604f73', '#31727e', '#8f3e62', '#4f6526', '#585d93', '#956446'];
const compare = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id);

export function makeRadialLayout(agents, links, driverId) {
  const ordered = [...agents].sort(compare);
  const byId = new Map(ordered.map((agent) => [agent.id, agent]));
  const parent = new Map();
  // A creator connected by delegation wins over display-order inference.
  for (const link of links) {
    if (link.kind === 'delegation' && link.to !== driverId && !parent.has(link.to)
      && byId.has(link.from) && byId.has(link.to)) parent.set(link.to, link.from);
    if (link.kind === 'delegation' && link.to !== driverId && byId.get(link.to)?.creatorId === link.from
      && byId.has(link.from)) parent.set(link.to, link.from);
  }
  // A dependency-only participant gets a spatial slot without implying ownership.
  const children = new Map(ordered.map(({ id }) => [id, []]));
  for (const agent of ordered) {
    if (agent.id !== driverId) children.get(parent.get(agent.id) ?? driverId).push(agent.id);
  }

  const weight = new Map();
  function weigh(id) {
    const value = Math.max(1, children.get(id).reduce((sum, child) => sum + weigh(child), 0));
    weight.set(id, value);
    return value;
  }
  weigh(driverId);

  const rings = [[{ id: driverId, angle: 0 }]];
  function allocate(id, start, arc, depth) {
    if (!rings[depth]) rings[depth] = [];
    const items = children.get(id);
    const sizes = items.map((child) => depth === 1 ? Math.sqrt(weight.get(child)) : weight.get(child));
    const total = sizes.reduce((sum, value) => sum + value, 0);
    items.forEach((child, index) => {
      const share = arc * sizes[index] / total;
      rings[depth].push({ id: child, angle: start + share / 2 });
      if (children.get(child).length) allocate(child, start + share * .04, share * .92, depth + 1);
      start += share;
    });
  }
  allocate(driverId, -Math.PI * .82, turn, 1);

  const points = new Map([[driverId, { x: 0, y: 0 }]]);
  const branchIds = new Set(parent.values());
  const isCore = (id) => !parent.has(parent.get(id)) || branchIds.has(id);
  let radius = 0;
  function place(ring) {
    if (!ring.length) return;
    const gap = ring.reduce((minimum, { angle }, index) => {
      const next = ring[index + 1]?.angle ?? ring[0].angle + turn;
      return Math.min(minimum, next - angle);
    }, Math.PI);
    radius = Math.max(radius + 138, 147 / (2 * Math.sin(gap / 2)));
    for (const { id, angle } of ring) {
      points.set(id, { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) });
    }
  }

  const layers = rings.slice(1);
  if (ordered.length > 20) {
    for (const layer of layers) place(layer.filter(({ id }) => isCore(id)));
    const clear = (x, y) => [...points.values()].every((point) =>
      Math.abs(x - point.x) >= 120 || Math.abs(y - point.y) >= 104);
    for (const [lead, members] of children) {
      const workers = members.filter((id) => !isCore(id));
      if (!workers.length) continue;
      const hub = points.get(lead);
      const angle = Math.atan2(hub.y, hub.x);
      const ox = Math.cos(angle);
      const oy = Math.sin(angle);
      const lanes = workers.length <= 3 ? [0, -130, 130] : [-130, 0, 130];
      let placed = 0;
      for (let row = 1; placed < workers.length; row++) {
        for (const lane of lanes) {
          if (placed === workers.length) break;
          const x = Math.round(hub.x + 142 * row * ox - lane * oy);
          const y = Math.round(hub.y + 142 * row * oy + lane * ox);
          if (clear(x, y)) points.set(workers[placed++], { x, y });
        }
      }
    }
  } else {
    for (const layer of layers) place(layer);
  }

  const groups = new Map();
  const define = (key, name) => {
    if (!groups.has(key)) groups.set(key, { key, name, color: tones[groups.size % tones.length] });
    return groups.get(key);
  };
  define(driverId, byId.get(driverId).name);
  for (const agent of ordered) {
    if (branchIds.has(agent.id) && agent.id !== driverId) define(agent.id, agent.name);
  }
  const branches = new Map(groups);
  const primary = new Map(ordered.map((agent) => {
    const creator = parent.get(agent.id);
    const group = creator ? branches.get(creator)
      : branches.get(agent.id) ?? define(agent.neighborhood ?? agent.workstreamIds?.[0] ?? 'Coordination',
        agent.neighborhood ?? agent.workstreamIds?.[0] ?? 'Coordination');
    return [agent.id, group];
  }));
  return { branches, primary, points, parent, isCore, ordered };
}

export function radialContext(layout, links, activeIds, focusId, wideEnough, showAll, priorityIds = new Set()) {
  const { parent, primary, branches, isCore, ordered } = layout;
  const adjacent = new Map(ordered.map(({ id }) => [id, new Set()]));
  const impacts = new Map(ordered.map(({ id }) => [id, new Map()]));
  for (const link of links) {
    adjacent.get(link.from).add(link.to);
    adjacent.get(link.to).add(link.from);
    const back = branches.get(link.from) ?? primary.get(link.from);
    const forward = branches.get(link.to) ?? primary.get(link.to);
    if (link.kind === 'dependency' || parent.get(link.to) !== link.from) {
      if (back.key !== forward.key) {
        impacts.get(link.to).set(back.key, back);
        impacts.get(link.from).set(forward.key, forward);
      }
    }
  }

  const distance = new Map(focusId ? [[focusId, 0]] : []);
  for (const id of distance.keys()) {
    for (const next of adjacent.get(id)) {
      if (!distance.has(next)) distance.set(next, distance.get(id) + 1);
    }
  }
  const focusGroup = (branches.get(focusId) ?? primary.get(focusId))?.key;
  const level = (id) => {
    if (!focusId) return 1;
    const hops = distance.get(id);
    if (hops === 0) return 4;
    if (hops === 1) return 3;
    if (hops <= 3 && (primary.get(id).key === focusGroup || branches.get(id)?.key === focusGroup || impacts.get(id).has(focusGroup))) return 2;
    return 0;
  };

  const visible = new Set();
  for (const { id } of ordered) {
    if (!activeIds.has(id)) continue;
    if (showAll || wideEnough || priorityIds.has(id) || isCore(id) || level(id) >= 2) {
      visible.add(id);
    }
  }

  const tucked = new Map();
  for (const id of activeIds) {
    if (!visible.has(id)) {
      const lead = parent.get(id);
      tucked.set(lead, (tucked.get(lead) ?? 0) + 1);
    }
  }
  return { visible, tucked, impacts, level };
}

export function radialBounds(points, ids, padding = 80) {
  const slots = [...ids].map((id) => points.get(id));
  if (!slots.length) slots.push({ x: 0, y: 0 });
  return {
    left: Math.min(...slots.map(({ x }) => x)) - padding,
    right: Math.max(...slots.map(({ x }) => x)) + padding,
    top: Math.min(...slots.map(({ y }) => y)) - padding,
    bottom: Math.max(...slots.map(({ y }) => y)) + padding,
  };
}

export function radialPath(start, end, curved, lane = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const bend = curved ? Math.min(53, length * .17) + lane : lane;
  const mx = (start.x + end.x) / 2 - dy / length * bend;
  const my = (start.y + end.y) / 2 + dx / length * bend;
  const unit = (x, y) => {
    const length = Math.hypot(x, y);
    return [x / length, y / length];
  };
  const [sx, sy] = unit(mx - start.x, my - start.y);
  const [ex, ey] = unit(mx - end.x, my - end.y);
  return `M ${start.x + 32 * sx} ${start.y + 32 * sy} Q ${mx} ${my} ${end.x + 34 * ex} ${end.y + 34 * ey}`;
}

// A focused map puts direct relationships inside and repeated second-hop
// destinations on the outside. Portal IDs are only used to draw the projection.
export function projectFocus(layout, links, visible, focusId) {
  const center = layout.points.get(focusId);
  const points = new Map([[focusId, center]]);
  const direct = new Set();
  const onward = new Set();
  for (const link of links) {
    if (link.from === focusId) {
      direct.add(link.to);
      onward.add(link.to);
    } else if (link.to === focusId) direct.add(link.from);
  }
  const sides = [
    { x: 1, y: 0, members: [] }, { x: 0, y: 1, members: [] },
    { x: -1, y: 0, members: [] }, { x: 0, y: -1, members: [] },
  ];
  const limit = Math.max(1, Math.ceil(direct.size / sides.length));
  const sideOf = new Map();
  for (const id of direct) {
    const candidate = layout.points.get(id);
    const dx = candidate.x - center.x;
    const dy = candidate.y - center.y;
    const side = sides.filter(({ members }) => members.length < limit)
      .sort((a, b) => (b.x - a.x) * dx + (b.y - a.y) * dy)[0];
    side.members.push(id);
    sideOf.set(id, side);
  }
  const xMargin = Math.max(153, 123 + Math.max(0, ...[1, 3].map((index) => (sides[index].members.length - 1) * 62)));
  const yMargin = Math.max(137, 105 + Math.max(0, ...[0, 2].map((index) => (sides[index].members.length - 1) * 51)));
  const axis = (side, id) => {
    const point = layout.points.get(id);
    return side.x ? point.y : point.x;
  };
  for (const side of sides) {
    side.members.sort((a, b) => axis(side, a) - axis(side, b));
    side.members.forEach((id, index) => {
      const offset = index - (side.members.length - 1) / 2;
      points.set(id, {
        x: center.x + side.x * xMargin + (side.y ? offset * 124 : 0),
        y: center.y + side.y * yMargin + (side.x ? offset * 102 : 0),
      });
    });
  }

  const secondHop = new Map();
  for (const link of links) {
    if (!onward.has(link.from) || !visible.has(link.to) || link.to === focusId) continue;
    if (!secondHop.has(link.to)) secondHop.set(link.to, []);
    secondHop.get(link.to).push(link);
  }
  const occupied = () => [...points.values()];
  const isFree = (x, y) => occupied().every((point) => Math.abs(x - point.x) >= 99 || Math.abs(y - point.y) >= 83);
  const portals = [];
  const rewired = new Map();
  for (const [destination, incoming] of secondHop) {
    const shared = new Set(incoming.map((link) => link.from)).size >= 2;
    if (!shared && direct.has(destination)) continue;
    for (const side of sides) {
      const sameSide = incoming.filter((link) => sideOf.get(link.from) === side);
      for (let offset = 0; offset < sameSide.length; offset += 3) {
        const batch = sameSide.slice(offset, offset + 3);
        const perpendicular = batch.reduce((sum, { from }) => sum + (side.x ? points.get(from).y : points.get(from).x), 0) / batch.length;
        const outward = side.x ? xMargin : yMargin;
        const step = side.x ? 97 : 113;
        let shift = 0;
        let point;
        do {
          const stagger = (shift % 2 ? 1 : -1) * Math.ceil(shift / 2) * step;
          point = side.x
            ? { x: center.x + side.x * (outward + 130), y: perpendicular + stagger }
            : { x: perpendicular + stagger, y: center.y + side.y * (outward + 116) };
          shift++;
        } while (!isFree(point.x, point.y));
        if (shared) {
          let key = `portal-${portals.length}`;
          while (layout.points.has(key) || points.has(key)) key += '-copy';
          points.set(key, point);
          for (const link of batch) rewired.set(link.id, key);
          portals.push({ key, destination, count: batch.length });
        } else {
          points.set(destination, point);
        }
      }
    }
  }

  const front = new Set([...points.keys()]);
  for (const id of visible) {
    if (points.has(id)) continue;
    const original = layout.points.get(id);
    const dx = original.x - center.x;
    const dy = original.y - center.y;
    const outside = Math.max(Math.abs(dx) / (xMargin + 138), Math.abs(dy) / (yMargin + 124));
    let scale = Math.max(1, 1.35 / outside);
    while (!isFree(center.x + dx * scale, center.y + dy * scale)) scale += .22;
    points.set(id, { x: center.x + dx * scale, y: center.y + dy * scale });
  }
  return { points, portals, rewired, front };
}
