# @wti/wti-ide

Browser-based Theia IDE application (standalone) built from npm-published `@theia/*@1.77.0`.

Requires Node.js 24 and pnpm 9.15.5. The app uses Theia’s esbuild bundler;
`esbuild.mjs` preserves the optional frontend `extensions/` asset copy.

## Run

From `ide/`:

- `./build.sh`
- `./run.sh`

Default URL: http://localhost:1771

## Upgrade notes (1.77.0)

- Upstream retired `@theia/preview` and `@theia/scm-extra`; they are no longer
  dependencies. The build downloads the pinned VS Code Markdown language features extension
  from Open VSX. The app loads it at startup for Markdown preview.
- Theia's runtime packages are ESM. The local infra extension uses NodeNext
  resolution and a `.js` relative import; the application build configuration
  remains an `.mjs` entry point.
- Direct Theia packages are pinned together. The old blanket `@theia/*` override
  is removed because independently versioned Monaco packages must not receive the
  framework version. The obsolete global Zod 3 override is also removed so each
  upstream consumer can resolve its supported major.
- Node 24 is the supported local toolchain; TypeScript 5.9 remains supported by
  Theia's 1.77 migration guide. Native dependencies need installation/rebuild on
  Node 24 before runtime checks.

Sources: [release](https://github.com/eclipse-theia/theia/releases/tag/v1.77.0),
[migration guide](https://github.com/eclipse-theia/theia/blob/17288a24d401a0ff8d72c11be75c39f1651d3320/doc/Migration.md).

### pnpm build layout

The generated esbuild configuration imports build helpers from the application,
so they are explicit devDependencies. The generated entrypoint also imports the
transitive telemetry extension, which is declared explicitly. `ide/.npmrc`
publicly hoists only native assets that Theia resolves from the application root.

### Validation

The rootless Ubuntu 24.04 container run completed successfully on 2026-11-22
at 02:31:40 UTC with Node 24.22.3 and pnpm 9.15.5: frozen install including native
modules, InfraAgent compilation, IDE bundling, frontend startup and Playwright
smoke (`1 passed`). The smoke verifies the registered Infra agent in AI settings.
No credentials or model prompts were used. The optional theme installer is separate from the Markdown plugin deployment.

For reproducible validation or a local GUI using the cached container image, see
[container instructions](../../tests/container/README.md).
