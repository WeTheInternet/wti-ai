// Host packaging only. The imported portable release is never rewritten.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../agent-graph');
const staged = path.join(here, '.build-src');
const out = path.join(here, 'dist');
await rm(staged, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await cp(path.join(source, 'src'), staged, { recursive: true });
await mkdir(path.join(out, 'types'), { recursive: true });
try {
    const names = await readdir(staged);
    const program = ts.createProgram(names.filter(name => name.endsWith('.ts')).map(name => path.join(staged, name)), {
        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        declaration: true, emitDeclarationOnly: true, allowImportingTsExtensions: true,
        strict: true, skipLibCheck: true, noEmitOnError: true,
        rootDir: staged, outDir: path.join(out, 'types')
    });
    const result = program.emit();
    const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics];
    if (diagnostics.length || result.emitSkipped) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: name => name, getCurrentDirectory: () => here,
            getNewLine: () => '\n'
        }) || 'Declaration emit failed');
    }
    for (const name of names.filter(name => name.endsWith('.d.ts'))) {
        await cp(path.join(staged, name), path.join(out, 'types', name));
    }
    // Normalize generated declarations only; retain all supporting layout types.
    for (const name of await readdir(path.join(out, 'types'))) {
        const file = path.join(out, 'types', name);
        const text = (await readFile(file, 'utf8')).replace(/(['"])(\.\.?\/[^'"\n]+)\.(?:ts|jsx)\1/g, '$1$2.js$1');
        await writeFile(file, text);
        for (const match of text.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
            const target = path.resolve(path.dirname(file), match[1].replace(/\.js$/, '.d.ts'));
            await readFile(target); // Fail rather than export a broken declaration graph.
        }
    }
    await build({
        absWorkingDir: here,
        entryPoints: { index: path.join(staged, 'index.ts'), react: path.join(staged, 'react.ts'), fixtures: path.join(staged, 'fixtures.ts') },
        bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022',
        outdir: out, external: ['react', 'react/*'], sourcemap: true
    });
    const artifact = await readFile(path.join(source, 'fixtures/lantern-handoff.md'), 'utf8');
    await writeFile(path.join(out, 'artifact.js'), `export default ${JSON.stringify(artifact)};\n`);
    await writeFile(path.join(out, 'artifact.d.ts'), 'declare const content: string;\nexport default content;\n');
    await cp(path.join(here, 'chrome.css'), path.join(out, 'chrome.css'));
    await cp(path.join(source, 'fixtures'), path.join(out, 'fixtures'), { recursive: true });
} finally {
    await rm(staged, { recursive: true, force: true });
}
