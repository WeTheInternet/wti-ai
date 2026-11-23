import type { GraphLink, Participant } from './index.ts';

export type LayoutParticipant = Participant & { order?: number; neighborhood?: string };
export interface Point { x: number; y: number }
export interface RankedPoint extends Point { row: number }
export interface GraphRank {
  agent: LayoutParticipant;
  rank: number;
  incoming: number;
  outgoing: string[];
}

export function topology(agents: readonly LayoutParticipant[], links: readonly GraphLink[]): Map<string, GraphRank> | null;
export function position(agents: readonly LayoutParticipant[], ranks: ReadonlyMap<string, GraphRank>, width: number): Map<string, RankedPoint>;
export function routeEdges(links: readonly GraphLink[], points: ReadonlyMap<string, RankedPoint>, width: number): Array<{ link: GraphLink; path: string }>;
