#!/usr/bin/env node
/**
 * Guards against the OPS-650 class of bug: a published package whose
 * `@askdialog/dialog-sdk` peerDependency does not match the SDK release line.
 *
 * The original failure (react@2.0.0 / vue@3.0.0 shipped with a stale
 * `@askdialog/dialog-sdk@1.2.0` peer) was invisible at the source level — the
 * committed package.json was correct, but `pnpm pack` resolved the peer to an
 * old SDK version at publish time. So this check inspects the REAL packed
 * tarball (the exact manifest npm receives), not the source file.
 *
 * Run it in CI after `changeset version` + build and before `changeset publish`
 * so a mismatched artifact can never reach npm.
 *
 * No external dependencies — uses node built-ins + the `tar` CLI.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_PEER = '@askdialog/dialog-sdk';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const majorOf = (range) => {
  const match = String(range).match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const sdkVersion = readJson(join(repoRoot, 'packages/sdk/package.json')).version;
const sdkMajor = majorOf(sdkVersion);

const packagesDir = join(repoRoot, 'packages');
const consumers = readdirSync(packagesDir)
  .map((name) => ({ dir: join(packagesDir, name), manifestPath: join(packagesDir, name, 'package.json') }))
  .filter(({ manifestPath }) => {
    try {
      return Boolean(readJson(manifestPath).peerDependencies?.[SDK_PEER]);
    } catch {
      return false;
    }
  })
  .map(({ dir, manifestPath }) => ({ dir, name: readJson(manifestPath).name }));

if (consumers.length === 0) {
  console.log(`No package declares a "${SDK_PEER}" peer. Nothing to verify.`);
  process.exit(0);
}

const packedPeerOf = (dir) => {
  const dest = mkdtempSync(join(tmpdir(), 'peer-check-'));
  execFileSync('pnpm', ['pack', '--pack-destination', dest], { cwd: dir, stdio: 'pipe' });
  const tgz = readdirSync(dest).find((f) => f.endsWith('.tgz'));
  const manifest = execFileSync('tar', ['-xzOf', join(dest, tgz), 'package/package.json'], {
    encoding: 'utf8',
  });
  return JSON.parse(manifest).peerDependencies?.[SDK_PEER];
};

const failures = [];
for (const { dir, name: pkgName } of consumers) {
  const peer = packedPeerOf(dir);
  const peerMajor = majorOf(peer);
  const aligned = peerMajor === sdkMajor;
  console.log(
    `${aligned ? '✓' : '✗'} ${pkgName}: packed peer "${SDK_PEER}@${peer}" vs SDK ${sdkVersion}`,
  );
  if (!aligned) {
    failures.push(
      `${pkgName} will publish "${SDK_PEER}@${peer}" (major ${peerMajor}) ` +
        `but the SDK is ${sdkVersion} (major ${sdkMajor}).`,
    );
  }
};

if (failures.length > 0) {
  console.error('\nPeer dependency mismatch — refusing to publish stale metadata (OPS-650):');
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}

console.log(`\nAll SDK peer dependencies align with the ${sdkMajor}.x release line.`);
