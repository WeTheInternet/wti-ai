import { cp, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { browserOptions, watch } from './gen-esbuild.browser.mjs';
import { nodeOptions } from './gen-esbuild.node.mjs';

// Preserve the optional static extension assets from the previous webpack setup.
// Theia compression must run last, after all onEnd asset writers.
// https://github.com/eclipse-theia/theia/blob/v1.77.0/dev-packages/application-manager/src/generator/bundler-generator.ts#L182-L183
browserOptions.plugins.unshift({
    name: 'wti-extension-assets',
    setup(build) {
        const source = fileURLToPath(new URL('./extensions', import.meta.url));
        const destination = fileURLToPath(new URL('./lib/frontend/extensions', import.meta.url));
        if (watch) {
            // Attach optional assets to the browser build's dependency graph.
            const marker = 'wti-extension-watch';
            (build.initialOptions.inject ??= []).push(marker);
            build.onResolve({ filter: /^wti-extension-watch$/ }, () => ({ path: marker, namespace: marker }));
            build.onLoad({ filter: /.*/, namespace: marker }, async () => {
                const watchFiles = [];
                const watchDirs = [path.dirname(source), source];
                try {
                    for (const entry of await readdir(source, { recursive: true, withFileTypes: true })) {
                        const name = path.join(entry.parentPath, entry.name);
                        (entry.isDirectory() ? watchDirs : watchFiles).push(name);
                    }
                } catch (error) {
                    if (error.code !== 'ENOENT') throw error;
                }
                return { contents: '', watchDirs, watchFiles };
            });
        }
        build.onEnd(async result => {
            if (result.errors.length) return;
            // This output directory belongs to the asset copy, including deletions.
            await rm(destination, { recursive: true, force: true });
            try {
                await stat(source);
            } catch (error) {
                if (error.code === 'ENOENT') return;
                throw error;
            }
            await cp(source, destination, { recursive: true });
        });
    }
});

const contexts = [];
try {
    contexts.push(await esbuild.context(browserOptions));
    contexts.push(await esbuild.context(nodeOptions));
    if (watch) {
        await Promise.all(contexts.map(context => context.watch()));
    } else {
        for (const context of contexts) await context.rebuild();
    }
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    if (!watch || process.exitCode) {
        await Promise.all(contexts.map(context => context.dispose()));
    }
}
