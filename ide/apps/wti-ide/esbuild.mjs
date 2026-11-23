import { cp, stat } from 'node:fs/promises';
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
        build.onEnd(async result => {
            if (result.errors.length) return;
            const source = fileURLToPath(new URL('./extensions/', import.meta.url));
            try {
                await stat(source);
            } catch (error) {
                if (error.code === 'ENOENT') return;
                throw error;
            }
            await cp(source, fileURLToPath(new URL('./lib/frontend/extensions/', import.meta.url)), { recursive: true });
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
