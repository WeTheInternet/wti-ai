import type { GraphLink } from './index.ts';
import type { LayoutParticipant, Point } from './graph.js';

export interface Crew { key: string; name: string; color: string }
export interface RadialLayout {
  branches: Map<string, Crew>;
  primary: Map<string, Crew>;
  points: Map<string, Point>;
  parent: Map<string, string>;
  isCore(id: string): boolean;
  ordered: LayoutParticipant[];
}

export function makeRadialLayout(agents: readonly LayoutParticipant[], links: readonly GraphLink[], driverId: string): RadialLayout;
export function radialContext(layout: RadialLayout, links: readonly GraphLink[], activeIds: ReadonlySet<string>, focusId: string | undefined, wideEnough: boolean, showAll: boolean): {
  visible: Set<string>;
  tucked: Map<string, number>;
  impacts: Map<string, Map<string, Crew>>;
  level(id: string): number;
};
export function projectFocus(layout: RadialLayout, links: readonly GraphLink[], visible: ReadonlySet<string>, focusId: string): {
  points: Map<string, Point>;
  portals: Array<{ key: string; destination: string; count: number }>;
  rewired: Map<string, string>;
  front: Set<string>;
};
