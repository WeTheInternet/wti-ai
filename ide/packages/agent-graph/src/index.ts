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
  attention?: {
    ownerId: string;
    detail: string;
    affectedId?: string;
    reportedStatus?: LinkStatus;
    reportedAt?: string; // ISO 8601. Defaults to the link's updatedAt.
    nextStep?: { label: string; href?: string };
  };
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

interface ParticipantReportBase {
  id: string;
  participantId: string;
  status: LinkStatus | 'blocked';
  reportedAt: string; // ISO 8601
  agentFollowUp?: string;
  history?: { href: string; verified: boolean };
  source?: { href: string; revision: string; blob?: string; publisher?: string };
}

export type ParticipantReport = ParticipantReportBase & (
  | { kind: 'blocker' | 'operatorRequest'; reason: string; actionOwnerId?: string; actionOwnerLabel?: string; humanDependency?: { detail: string; assigneeId?: string; assigneeLabel?: string }; action?: { label: string; href: string; preview?: { title: string; body: string } } }
  | { kind: 'routine'; details?: string }
);

export type CrewReportSource =
  | { state: 'available'; staleAfterMs?: number }
  | { state: 'unavailable'; reason?: string; lastVerified?: boolean; staleAfterMs?: number };

export interface AgentGraphDataset {
  options: readonly { id: string; label: string; source: 'fixture' | 'crew-ledger' }[];
  selectedId: string; // Identifies the snapshot and reports currently rendered.
  onChange(id: string): void;
  provenance?: { sourceLabel?: string; observedAt?: string };
  crewReports?: CrewReportSource;
}

export interface AgentGraphProps {
  snapshot: GraphSnapshotV1;
  now?: string;
  selection?: GraphSelection; // Omitted = uncontrolled. null = clear.
  onSelectionChange?: (selection: GraphSelection) => void;
  host?: AgentGraphHost;
  reports?: readonly ParticipantReport[];
  ledger?: { order: 'chronological'; operatorId?: string };
  dataset?: AgentGraphDataset;
}

export interface AgentGraphFixtures {
  small: GraphSnapshotV1;
  dense: GraphSnapshotV1;
  status: { before: GraphSnapshotV1; after: GraphSnapshotV1 };
}

export {
  communicationLabel, isStaleReport, liveLinksOf, normalizeCommunicationKind, normalizeLinkStatus, selectionFor,
} from './model.ts';
export { topology, position, routeEdges } from './graph.js';
export { makeRadialLayout, projectFocus, radialContext } from './radial.js';
