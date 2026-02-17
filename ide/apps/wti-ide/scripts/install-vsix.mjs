#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const argv = process.argv.slice(2);
const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const extensionsDir = path.resolve(rootDir, 'extensions');

const vsixToInstall = [
  {
    id: 'ms-vscode.vscode-theme-tokyo-night',
    url: 'https://open-vsx.org/api/ms-vscode/vscode-theme-tokyo-night/latest/file/ms-vscode.vscode-theme-tokyo-night-latest.vsix'
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function download(url, destFile) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destFile);
    https
      .get(url, res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(destFile);
          resolve(download(res.headers.location, destFile));
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destFile);
          reject(new Error(`Download failed (${res.statusCode}) for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', err => {
        file.close();
        if (fs.existsSync(destFile)) fs.unlinkSync(destFile);
        reject(err);
      });
  });
}

async function main() {
  const clean = argv.includes('--clean');

  if (clean) {
    rmDir(extensionsDir);
    return;
  }

  ensureDir(extensionsDir);

  for (const ext of vsixToInstall) {
    const target = path.resolve(extensionsDir, `${ext.id}.vsix`);
    await download(ext.url, target);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
