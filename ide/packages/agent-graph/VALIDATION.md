# Validation on the isolated Lab workspace

- Node 24 ran four model and fixture tests through the public `agent-graph` and `agent-graph/fixtures` entry points.
- The pre-existing esbuild and React 19 toolchain built the browser demo through `agent-graph/react`. The same toolchain ran `tests/render-smoke.jsx` with the CSS loader disabled for server rendering. Assertions covered controlled selection, artifact availability, selecting without opening, the cycle fallback, truthful receipts, unknown status, and completed history.
- The installed Chromium failed to launch in this Lab because its process singleton socket operation was denied. A live keyboard, focus, and editor-open test remains for the integration checkout. Static rendering does not establish those interactions.
- A full TypeScript compiler pass was not performed. The Lab used its existing transpiler and Node's type stripping. No packages were installed.
