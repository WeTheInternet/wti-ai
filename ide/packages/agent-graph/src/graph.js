export const states = {
  active: { label: 'Active', symbol: '●' },
  action: { label: 'Action needed', symbol: '!' },
  check: { label: 'Fresh check', symbol: '✓' },
  hold: { label: 'On hold', symbol: 'Ⅱ' },
  interrupted: { label: 'Interrupted', symbol: '×' },
  completed: { label: 'Completed', symbol: '✓' },
  unknown: { label: 'Unknown', symbol: '?' },
};

export const stateFor = (status) => Object.hasOwn(states, status) ? states[status] : states.unknown;

export function ageOf(at, now) {
  const minutes = Math.max(0, Math.floor((Date.parse(now) - Date.parse(at)) / 60000));
  return {
    className: minutes >= 60 ? 'stale' : minutes >= 10 ? 'older' : 'fresh',
    label: minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m old` : `${minutes}m ago`,
  };
}

export function topology(agents, links) {
  const nodes = new Map(agents.map((agent) => [agent.id, { agent, rank: 0, incoming: 0, outgoing: [] }]));
  for (const link of links) {
    if (!nodes.has(link.from) || !nodes.has(link.to)) continue;
    nodes.get(link.from).outgoing.push(link.to);
    nodes.get(link.to).incoming++;
  }

  const queue = [...nodes.values()].filter(({ incoming }) => incoming === 0);
  for (const node of queue) {
    for (const id of node.outgoing) {
      const child = nodes.get(id);
      child.rank = Math.max(child.rank, node.rank + 1);
      child.incoming--;
      if (child.incoming === 0) queue.push(child);
    }
  }
  return queue.length === agents.length ? nodes : null;
}

export function position(agents, ranks, width) {
  const columns = Math.max(1, Math.floor((width - 28) / 137));
  const rows = new Map();
  const points = new Map();
  for (const agent of agents) {
    const rank = ranks.get(agent.id).rank;
    if (!rows.has(rank)) rows.set(rank, []);
    rows.get(rank).push(agent);
  }

  let row = 0;
  const available = width - 30;
  for (const [, members] of [...rows].sort(([left], [right]) => left - right)) {
    members.sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id));
    for (let offset = 0; offset < members.length; offset += columns) {
      const batch = members.slice(offset, offset + columns);
      const step = Math.min(165, available / batch.length);
      for (const [index, agent] of batch.entries()) {
        points.set(agent.id, { x: width / 2 + (index - (batch.length - 1) / 2) * step, y: 65 + row * 127, row });
      }
      row++;
    }
  }
  return points;
}

export function routeEdges(links, points, width) {
  const outgoing = new Map();
  const incoming = new Map();
  for (const link of links) {
    if (!outgoing.has(link.from)) outgoing.set(link.from, []);
    if (!incoming.has(link.to)) incoming.set(link.to, []);
    outgoing.get(link.from).push(link);
    incoming.get(link.to).push(link);
  }
  for (const list of outgoing.values()) list.sort((a, b) => points.get(a.to).x - points.get(b.to).x || a.id.localeCompare(b.id));
  for (const list of incoming.values()) list.sort((a, b) => points.get(a.from).x - points.get(b.from).x || a.id.localeCompare(b.id));
  const port = (list, link) => (list.indexOf(link) - (list.length - 1) / 2) * Math.min(11, 43 / list.length);

  return links.map((link, index) => {
    const start = points.get(link.from);
    const end = points.get(link.to);
    const x1 = start.x + port(outgoing.get(link.from), link);
    const x2 = end.x + port(incoming.get(link.to), link);
    const y1 = start.y + 42;
    const y2 = end.y - 43;
    if (end.row - start.row === 1) {
      const middle = (y1 + y2) / 2;
      return { link, path: `M ${x1} ${y1} C ${x1} ${middle} ${x2} ${middle} ${x2} ${y2}` };
    }
    const rail = (start.x + end.x < width) ? 10 + (index % 4) * 3 : width - 10 - (index % 4) * 3;
    return {
      link,
      path: `M ${x1} ${y1} C ${x1} ${y1 + 12} ${rail} ${y1 + 12} ${rail} ${y1 + 25}
        L ${rail} ${y2 - 23} C ${rail} ${y2 - 10} ${x2} ${y2 - 12} ${x2} ${y2}`,
    };
  });
}

// Retain one route from the driver into the named neighborhood.
export function bridgeTo(driverId, members, links) {
  const routes = [[driverId]];
  const visited = new Set([driverId]);
  for (const route of routes) {
    const last = route.at(-1);
    if (members.has(last)) return route;
    for (const link of links) {
      if (link.from !== last || visited.has(link.to)) continue;
      visited.add(link.to);
      routes.push([...route, link.to]);
    }
  }
  return [driverId];
}
