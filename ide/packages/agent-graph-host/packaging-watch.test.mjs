import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild, watchInputs } from './watch.mjs';

// Real packaging in disposable copies: never edit the imported portable release.
test('real host staging starts clean and rebuilds changed portable fixture bytes', { timeout: 120000 }, async () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = await mkdtemp(path.join(tmpdir(), 'graph-packaging-watch-'));
    const host = path.join(root, 'agent-graph-host');
    const portable = path.join(root, 'agent-graph');
    let watcher;
    try {
        await mkdir(host);
        for (const name of ['build.mjs', 'package.json', 'chrome.css']) await cp(path.join(here, name), path.join(host, name));
        for (const name of ['src', 'fixtures']) await cp(path.resolve(here, '../agent-graph', name), path.join(portable, name), { recursive: true });
        await symlink(path.join(here, 'node_modules'), path.join(host, 'node_modules'), 'dir');
        const input = path.join(portable, 'fixtures/lantern-handoff.md');
        const artifact = path.join(host, 'dist/artifact.js');
        const original = await readFile(input, 'utf8');
        watcher = await watchInputs({ inputs: [path.join(portable, 'src'), path.join(portable, 'fixtures')],
            intervalMs: 60000, build: signal => runBuild(host, signal) });
        assert.equal(await readFile(artifact, 'utf8'), `export default ${JSON.stringify(original)};\n`);
        assert.ok((await readFile(path.join(host, 'dist/react.js'), 'utf8')).length);
        assert.ok((await readFile(path.join(host, 'dist/types/index.d.ts'), 'utf8')).length);
        const changed = original + '\nSynthetic watch update.\n';
        await writeFile(input, changed);
        await watcher.tick();
        assert.equal(await readFile(artifact, 'utf8'), `export default ${JSON.stringify(changed)};\n`);
    } finally { await watcher?.close(); await rm(root, { recursive: true, force: true }); }
});
