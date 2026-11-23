import { test, expect } from '@playwright/test';
import { createArtifactCapability } from '../../../agents/infra/src/browser/agent-graph-artifacts';

test('artifact availability is inert and explicit open uses only the host target', async () => {
    const target = Object.freeze({ editorTarget: 'host-owned-test-target' });
    const opened: object[] = [];
    const capability = createArtifactCapability(new Map([['test-ref', target]]), async value => {
        opened.push(value);
    });
    expect(capability.isAvailable('test-ref')).toBe(true);
    expect(opened).toEqual([]);
    expect(await capability.openArtifact('test-ref')).toEqual({ status: 'opened' });
    expect(opened).toEqual([target]);
});

test('unregistered paths, URIs and later map additions never invoke the editor', async () => {
    const registry = new Map([['test-ref', 'host-target']]);
    const opened: string[] = [];
    const capability = createArtifactCapability(registry, async value => { opened.push(value); });
    registry.set('late-ref', 'late-target');
    for (const ref of ['unknown', '../fixture.md', 'file:///fixture.md', 'https://example.invalid', 'late-ref']) {
        expect(capability.isAvailable(ref)).toBe(false);
        expect((await capability.openArtifact(ref)).status).toBe('unavailable');
    }
    expect(opened).toEqual([]);
});

test('opening awaits completion and reports sanitized failure', async () => {
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    const capability = createArtifactCapability(new Map([['test-ref', 'host-target']]), () => pending);
    let settled = false;
    const result = capability.openArtifact('test-ref').then(value => { settled = true; return value; });
    await Promise.resolve();
    expect(settled).toBe(false);
    finish();
    expect(await result).toEqual({ status: 'opened' });

    const broken = createArtifactCapability(new Map([['test-ref', 'host-target']]), async () => {
        throw new Error('private host path');
    });
    expect(await broken.openArtifact('test-ref')).toEqual({
        status: 'failed', message: 'The editor could not open this artifact.'
    });
});
