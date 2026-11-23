import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promotePackage } from './promote.mjs';

for (const failRollback of [false, true]) {
    test(`failed promotion ${failRollback ? 'preserves backup if rollback also fails' : 'restores last-good package'}`, async () => {
        const root = await mkdtemp(path.join(tmpdir(), 'graph-promote-'));
        const destination = path.join(root, 'dist');
        const candidate = path.join(root, 'candidate');
        const backup = path.join(root, 'backup');
        try {
            for (const directory of [destination, candidate]) await mkdir(directory);
            await writeFile(path.join(destination, 'index.js'), 'last good');
            await writeFile(path.join(candidate, 'index.js'), 'candidate');
            await assert.rejects(promotePackage(candidate, destination, backup, async (from, to) => {
                if (from === candidate || (failRollback && from === backup)) throw new Error('Synthetic rename failure');
                await rename(from, to);
            }), failRollback ? /previous exports retained/ : /Synthetic rename failure/);
            assert.equal(await readFile(path.join(failRollback ? backup : destination, 'index.js'), 'utf8'), 'last good');
        } finally { await rm(root, { recursive: true, force: true }); }
    });
}
