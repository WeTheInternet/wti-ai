import { test, expect } from '@playwright/test';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { startTheia } from '../fixtures/start-theia';

// No Theia build/browser required: exercise the actual lifecycle entry point with
// a pnpm stand-in that launches a child, just as the real CLI wrapper does.
test.describe('Theia process lifecycle', () => {
  test.describe.configure({ mode: 'serial' });
  for (const mode of ['ready', 'exit', 'timeout']) {
    test(`${mode}: isolates config and cleans up wrapper and child`, async () => {
      test.skip(process.platform === 'win32', 'POSIX process groups');
      const folder = await mkdtemp(path.join(tmpdir(), 'wti-lifecycle-'));
      const receipt = path.join(folder, 'receipt.json');
      const inheritedConfig = path.join(folder, 'inherited-config');
      const oldPath = process.env.PATH;
      const oldConfig = process.env.THEIA_CONFIG_DIR;
      const server = createServer();
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
      }).catch(async error => {
        await rm(folder, { recursive: true, force: true });
        throw error;
      });
      const port = (server.address() as { port: number }).port;
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await writeFile(path.join(folder, 'pnpm'), `#!${process.execPath}
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], { stdio: 'inherit' });
fs.writeFileSync(${JSON.stringify(receipt)}, JSON.stringify({ config: process.env.THEIA_CONFIG_DIR, child: child.pid, parent: process.pid }));
if (${JSON.stringify(mode)} === 'exit') setTimeout(() => process.exit(23), 150);
else if (${JSON.stringify(mode)} === 'ready') require('node:http').createServer((req, res) => res.end('ready')).listen(${port}, '127.0.0.1');
else setInterval(() => {}, 1000);
`, { mode: 0o700 });
      process.env.PATH = folder;
      process.env.THEIA_CONFIG_DIR = inheritedConfig;
      let active: Awaited<ReturnType<typeof startTheia>> | undefined;
      try {
        if (mode === 'ready') {
          const first = active = await startTheia({ port, timeout: 5_000 });
          const firstRecord = JSON.parse(await readFile(receipt, 'utf8'));
          await first.dispose();
          await expectStopped(firstRecord);
          const second = active = await startTheia({ port, timeout: 5_000 });
          try {
            const record = JSON.parse(await readFile(receipt, 'utf8'));
            expect(record.config).not.toBe(firstRecord.config);
            expect(record.config).not.toBe(inheritedConfig);
          } finally { await second.dispose(); }
        } else {
          await expect(startTheia({ port, timeout: mode === 'timeout' ? 1_000 : 5_000 }))
            .rejects.toThrow(mode === 'exit' ? 'code=23' : 'Timed out waiting');
        }
        const record = JSON.parse(await readFile(receipt, 'utf8'));
        expect(record.config).not.toBe(inheritedConfig);
        await expectStopped(record);
      } finally {
        await active?.dispose();
        if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath;
        if (oldConfig === undefined) delete process.env.THEIA_CONFIG_DIR; else process.env.THEIA_CONFIG_DIR = oldConfig;
        await rm(folder, { recursive: true, force: true });
      }
    });
  }
});

async function expectStopped(record: { config: string; child: number; parent: number }) {
  await expect(readFile(path.join(record.config, 'settings.json'))).rejects.toThrow();
  const { stat } = await import('node:fs/promises');
  await expect(stat(record.config)).rejects.toThrow();
  for (const pid of [record.parent, record.child]) {
    await expect.poll(async () => {
      try { process.kill(pid, 0); } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') return true;
        throw error;
      }
      // Orphans can remain zombies until container PID 1 reaps them; they cannot run.
      if (process.platform === 'linux') {
        try { return (await readFile(`/proc/${pid}/stat`, 'utf8')).split(') ')[1].startsWith('Z'); }
        catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true; throw error; }
      }
      return false;
    }).toBe(true);
  }
}
