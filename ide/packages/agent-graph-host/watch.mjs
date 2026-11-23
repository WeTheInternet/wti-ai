import { createHash } from 'node:crypto';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Poll only explicit source roots, never dist/node_modules or a workspace tree.
export async function fingerprint(inputs) {
    const hash = createHash('sha256');
    async function visit(file) {
        hash.update(file).update('\0');
        let stat;
        try { stat = await lstat(file); }
        catch (error) { if (error.code === 'ENOENT') { hash.update('missing'); return; } throw error; }
        if (stat.isSymbolicLink()) throw new Error(`Watch inputs must not be symlinks: ${file}`);
        if (stat.isDirectory()) {
            for (const name of (await readdir(file)).sort()) await visit(path.join(file, name));
        } else if (stat.isFile()) hash.update(await readFile(file));
    }
    for (const input of inputs) await visit(input);
    return hash.digest('hex');
}

/** Serial builds; edits arriving during a build remain dirty for the next tick. */
export async function watchInputs({ inputs, build, intervalMs = 500, onError = console.error, controller = new AbortController(), prebuilt = false }) {
    let stopped = false;
    let running;
    let previous;
    async function tick() {
        if (stopped || running) return running;
        running = (async () => {
            const next = await fingerprint(inputs);
            if (stopped || next === previous) return;
            previous = next;
            await build(controller.signal);
        })();
        try { await running; } finally { running = undefined; }
    }
    if (prebuilt) previous = await fingerprint(inputs);
    else await tick(); // Clean checkout must produce exports; initial failure is fatal.
    const timer = setInterval(() => { void tick().catch(onError); }, intervalMs);
    return {
        tick,
        async close() {
            stopped = true;
            clearInterval(timer);
            controller.abort();
            await running?.catch(() => undefined);
        }
    };
}

export function runBuild(here, signal) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(here, 'build.mjs')], {
            cwd: here, stdio: 'inherit', detached: process.platform !== 'win32'
        });
        let cancelled = false;
        let force;
        function kill(kind) {
            try {
                if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, kind);
                else child.kill(kind);
            } catch (error) { if (error.code !== 'ESRCH') throw error; }
        }
        function cancel() {
            if (cancelled) return;
            cancelled = true;
            kill('SIGTERM');
            force = setTimeout(() => kill('SIGKILL'), 2000);
        }
        const timeout = setTimeout(cancel, 300000);
        function cleanup() {
            clearTimeout(timeout); clearTimeout(force);
            signal.removeEventListener('abort', cancel);
        }
        signal.addEventListener('abort', cancel, { once: true });
        if (signal.aborted) cancel();
        child.once('error', error => { cleanup(); reject(error); });
        child.once('close', code => {
            cleanup();
            if (code === 0 && !cancelled) resolve();
            else reject(new Error(`Agent Graph build ${cancelled ? 'cancelled or timed out' : `exited ${code}`}`));
        });
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    let watcher;
    let stopping = false;
    const controller = new AbortController();
    const close = async () => { stopping = true; controller.abort(); await watcher?.close(); };
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
    watcher = await watchInputs({
        controller,
        prebuilt: process.env.WTI_AGENT_GRAPH_PREBUILT === '1',
        inputs: [path.resolve(here, '../agent-graph/src'), path.resolve(here, '../agent-graph/fixtures'),
            path.join(here, 'chrome.css'), path.join(here, 'build.mjs'), path.join(here, 'package.json')],
        build: signal => runBuild(here, signal)
    });
    if (stopping) await watcher.close();
}
