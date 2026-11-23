import type { CommunicationEvent, GraphLink, Participant } from './index.ts';

interface BaselineSample {
  id: string;
  driverId: string;
  name: string;
  agents: readonly (Participant & { neighborhood: string })[];
  links: readonly GraphLink[];
  events: readonly Omit<CommunicationEvent, 'source'>[];
}
export const snapshotAt: string;
export const baseline: { pilot: BaselineSample; dense: BaselineSample };
