import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../', import.meta.url));
const { theiaPlugins } = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8'));
const plugins = path.join(app, 'plugins');
const marker = '.wti-download-complete';

async function installed(id, url) {
    try {
        return await readFile(path.join(plugins, id, marker), 'utf8') === url;
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
        throw error;
    }
}

async function install() {
    const missing = {};
    for (const [id, url] of Object.entries(theiaPlugins)) {
        if (!await installed(id, url)) missing[id] = url;
    }
    if (Object.keys(missing).length === 0) return;

    // Keep staging outside the deployed plugin directory, on the same filesystem.
    const cache = path.join(app, '.cache');
    await mkdir(cache, { recursive: true });
    await mkdir(plugins, { recursive: true });
    const stage = await mkdtemp(path.join(cache, 'markdown-'));
    try {
        await writeFile(path.join(stage, 'package.json'), JSON.stringify({ theiaPlugins: missing }));
        const cli = fileURLToPath(import.meta.resolve('@theia/cli/bin/theia.js'));
        execFileSync(process.execPath, [cli, 'download:plugins', '--strict-ssl'], { cwd: stage, stdio: 'inherit' });
        for (const [id, url] of Object.entries(missing)) {
            const ready = path.join(stage, 'plugins', id);
            await writeFile(path.join(ready, marker), url);
            if (await installed(id, url)) continue;
            const target = path.join(plugins, id);
            // Older or interrupted downloads lack the marker. Move only this
            // declared plugin out of the way before publishing the complete tree.
            try {
                await rename(target, path.join(stage, 'previous-' + id));
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }
            try {
                await rename(ready, target);
            } catch (error) {
                // Another install may have published the same pin first.
                if (!await installed(id, url)) throw error;
            }
        }
    } finally {
        await rm(stage, { recursive: true, force: true });
    }
}

await install();
