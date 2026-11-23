export type LinkStatus =
  | 'active' | 'action' | 'check' | 'hold'
  | 'interrupted' | 'completed' | 'unknown';

export type CommunicationKind =
  | 'queued' | 'delivered' | 'acknowledged'
  | 'resultReported' | 'resultAccepted' | 'unknown';

export interface Participant {
  id: string;
  name: string;
  role: string;
  creatorId?: string;
  workstreamIds?: readonly string[];
  artifacts?: readonly Artifact[];
}

export interface Artifact {
  opaqueRef: string;
  label: string;
}

export interface GraphLink {
  id: string;
  from: string;
  to: string;
  kind: 'delegation' | 'dependency';
  status: LinkStatus;
  updatedAt: string;
  label: string;
  attention?: { ownerId: string; detail: string };
}

export interface CommunicationEvent {
  id: string;
  from: string;
  to: string;
  kind: CommunicationKind;
  at: string;
  source: string;
  correlationId?: string;
  label: string;
}

export interface GraphSnapshotV1 {
  schemaVersion: 1;
  effortId: string;
  name: string;
  revision: string;
  asOf: string;
  driverId: string;
  participants: readonly Participant[];
  links: readonly GraphLink[];
  communication: readonly CommunicationEvent[];
}

export type GraphSelection = { effortId: string; participantId: string } | null;

export interface AgentGraphHost {
  readonly openArtifact?: {
    isAvailable(opaqueRef: string): boolean;
    openArtifact(opaqueRef: string): Promise<
      | { status: 'opened' }
      | { status: 'unavailable' | 'failed'; message: string }
    >;
  };
}

export interface AgentGraphProps {
  snapshot: GraphSnapshotV1;
  now?: string;
  selection?: GraphSelection; // Omitted = uncontrolled. null = clear.
  onSelectionChange?: (selection: GraphSelection) => void;
  host?: AgentGraphHost;
}

export interface AgentGraphFixtures {
  small: GraphSnapshotV1;
  dense: GraphSnapshotV1;
  status: { before: GraphSnapshotV1; after: GraphSnapshotV1 };
}

export {
  communicationLabel, liveLinksOf, normalizeCommunicationKind, normalizeLinkStatus, selectionFor,
} from './model.ts';
export { topology, position, routeEdges } from './graph.js';
export { makeRadialLayout, projectFocus, radialContext } from './radial.js';
