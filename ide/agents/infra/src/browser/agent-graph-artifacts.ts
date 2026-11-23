/**
 * Host-side artifact capability for the portable Agent Graph.
 *
 * Only host-registered opaque references can reach the editor callback. The
 * graph never supplies an editor URI, workspace path, or opener command.
 * This seam is deliberately not registered until the portable panel is wired.
 */
export function createArtifactCapability<Target>(
    artifacts: ReadonlyMap<string, Target>,
    openInEditor: (target: Target) => Promise<unknown>
) {
    // Copy membership so later mutation of the caller's map cannot grant access.
    const allowed = new Map(artifacts);
    return {
        isAvailable(opaqueRef: string): boolean {
            return allowed.has(opaqueRef);
        },
        async openArtifact(opaqueRef: string): Promise<
            | { status: 'opened' }
            | { status: 'unavailable' | 'failed'; message: string }
        > {
            if (!allowed.has(opaqueRef)) {
                return { status: 'unavailable', message: 'Artifact is not available in this host.' };
            }
            try {
                await openInEditor(allowed.get(opaqueRef)!);
                return { status: 'opened' };
            } catch {
                // Editor errors may include local paths or other host details.
                return { status: 'failed', message: 'The editor could not open this artifact.' };
            }
        }
    };
}
