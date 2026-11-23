import * as React from 'react';
import type { AgentGraphProps } from './index.ts';
import { GraphView } from './AgentBubbles.jsx';

export type { AgentGraphProps } from './index.ts';

export function AgentGraph(props: AgentGraphProps): React.ReactElement {
  return React.createElement(GraphView, props);
}
