import { injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import type { Resource, ResourceResolver } from '@theia/core/lib/common/resource';
import content from '@wti/agent-graph/artifact';

export const ARTIFACT_REF = 'fixture:lantern-handoff';
export const ARTIFACT_URI = new URI('wti-agent-graph:/fixtures/lantern-handoff.md');

/** Exact packaged fixture bytes in a read-only native editor resource. */
@injectable()
export class AgentGraphResourceResolver implements ResourceResolver {
    resolve(uri: URI): Resource {
        if (uri.toString() !== ARTIFACT_URI.toString()) {
            throw new Error('Unknown Agent Graph resource.');
        }
        return {
            uri, readOnly: true,
            readContents: async () => content,
            dispose: () => undefined
        };
    }
}
