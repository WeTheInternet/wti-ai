import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { watchInputs } from './watch.mjs';

test('orchestrated prebuilt mode skips only the initial build, not later edits', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'graph-watch-prebuilt-'));
    const input = path.join(root, 'source');
    await writeFile(input, 'already built');
    let calls = 0;
    let watcher;
    try {
        watcher = await watchInputs({ inputs: [input], prebuilt: true, intervalMs: 60000,
            build: async () => { calls++; } });
        assert.equal(calls, 0);
        await writeFile(input, 'changed');
        await watcher.tick();
        assert.equal(calls, 1);
    } finally { await watcher?.close(); await rm(root, { recursive: true, force: true }); }
});

test('clean staging, subsequent edits, ignored outputs and lifecycle cleanup', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'graph-watch-'));
    const source = path.join(root, 'source');
    const output = path.join(root, 'dist', 'artifact.js');
    await mkdir(source);
    const input = path.join(source, 'fixture.md');
    await writeFile(input, 'first');
    let calls = 0;
    let watcher;
    try {
        watcher = await watchInputs({ inputs: [source], intervalMs: 60000, build: async () => {
            calls++;
            await mkdir(path.dirname(output), { recursive: true });
            await writeFile(output, await readFile(input));
        } });
        assert.equal(await readFile(output, 'utf8'), 'first');
        await writeFile(input, 'second');
        await watcher.tick();
        assert.equal(await readFile(output, 'utf8'), 'second');
        assert.equal(calls, 2); // An initial-build-only watcher fails here.
        await writeFile(output, 'output-only edit');
        await watcher.tick();
        assert.equal(calls, 2);
        await watcher.close();
        await writeFile(input, 'after close');
        await watcher.tick();
        assert.equal(calls, 2);
    } finally { await watcher?.close(); await rm(root, { recursive: true, force: true }); }
});

test('edits during a build are not dropped and shutdown aborts the active build', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'graph-watch-'));
    const input = path.join(root, 'input');
    await writeFile(input, 'initial');
    let calls = 0;
    let release;
    let started;
    let aborted = false;
    let watcher;
    try {
        watcher = await watchInputs({ inputs: [input], intervalMs: 60000, build: async signal => {
            calls++;
            if (calls === 1) return;
            await new Promise(resolve => {
                release = resolve;
                signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true });
                started?.();
            });
        } });
        await writeFile(input, 'edit one');
        const began = new Promise(resolve => { started = resolve; });
        const building = watcher.tick();
        await began;
        await writeFile(input, 'edit during build');
        release(); await building;
        const beganAgain = new Promise(resolve => { started = resolve; });
        const buildingAgain = watcher.tick();
        await beganAgain;
        assert.equal(calls, 3);
        await watcher.close(); await buildingAgain;
        assert.equal(aborted, true);
    } finally { await watcher?.close(); await rm(root, { recursive: true, force: true }); }
});
