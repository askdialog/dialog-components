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
 * so a mismatched artifact can never reach npm. On a pull request, before
 * `changeset version`, a pending major changeset of the SDK counts: the peers
 * are then expected on the next major.
 *
 * It also checks the peer's lower bound: every SDK subpath the packed build
 * imports (`@askdialog/dialog-sdk/events`, …) must be exported by the oldest
 * SDK the range accepts, read from npm, or from the local SDK when the floor
 * is the version about to be published. react@3.5.0 shipped importing
 * `/events` (SDK 3.8.0) under a `^3.4.0` peer.
 *
 * No external dependencies — uses node built-ins, the `tar` CLI and `npm view`.
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

const changesetDir = join(repoRoot, '.changeset');
const pendingSdkMajor = readdirSync(changesetDir)
  .filter((file) => file.endsWith('.md') && file !== 'README.md')
  .some((file) => {
    const frontmatter = readFileSync(join(changesetDir, file), 'utf8').match(/^---\n([\s\S]*?)\n---/);
    return /^\s*["']?@askdialog\/dialog-sdk["']?\s*:\s*["']?major/m.test(frontmatter?.[1] ?? '');
  });

const sdkVersion = readJson(join(repoRoot, 'packages/sdk/package.json')).version;
const sdkMajor = majorOf(sdkVersion) + (pendingSdkMajor ? 1 : 0);
const sdkRelease = pendingSdkMajor ? `${sdkVersion} + a pending major changeset` : sdkVersion;

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

// The packed peer range and the SDK subpaths the packed build imports.
const packed = (dir) => {
  const dest = mkdtempSync(join(tmpdir(), 'peer-check-'));
  execFileSync('pnpm', ['pack', '--pack-destination', dest], { cwd: dir, stdio: 'pipe' });
  const tgz = readdirSync(dest).find((f) => f.endsWith('.tgz'));
  execFileSync('tar', ['-xzf', join(dest, tgz), '-C', dest]);
  const manifest = readJson(join(dest, 'package/package.json'));
  const subpaths = new Set();
  const scan = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        scan(path);
      } else if (/\.(c|m)?js$/.test(entry.name)) {
        for (const [, subpath] of readFileSync(path, 'utf8').matchAll(
          /["']@askdialog\/dialog-sdk\/([\w-]+)["']/g,
        )) {
          subpaths.add(`./${subpath}`);
        }
      }
    }
  };
  scan(join(dest, 'package'));
  return { peer: manifest.peerDependencies?.[SDK_PEER], subpaths: [...subpaths].sort() };
};

// The exports of the oldest SDK a range accepts (`^3.8.0`, `~3.8.0`, `>=3.8.0`),
// read from npm. A floor npm lacks is accepted only when it is above npm's
// `latest`, i.e. the next release, checked against this tree's SDK, and not
// above a released SDK version this tree carries. Any other missing floor
// (a typo, a skipped version) fails.
const npmView = (spec, field) => {
  try {
    const out = execFileSync('npm', ['view', spec, field, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.trim() === '' ? undefined : JSON.parse(out);
  } catch (error) {
    if (/E404/.test(String(error.stderr))) {
      return undefined;
    }
    throw error;
  }
};
const compare = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(/[.-]/).slice(0, 3).map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};
const isRelease = (version) => /^\d+\.\d+\.\d+$/.test(version);
let latestSdk;
const sdkExports = new Map();
const resolveFloor = (floor) => {
  const published = npmView(`${SDK_PEER}@${floor}`, 'exports');
  if (published !== undefined) {
    return { exports: published, source: 'npm' };
  }
  latestSdk ??= npmView(SDK_PEER, 'version');
  if (latestSdk !== undefined && compare(floor, latestSdk) <= 0) {
    return { error: `SDK ${floor} is not on npm (latest ${latestSdk})` };
  }
  // The tree carries a released version after `changeset version`; on
  // staging it is stale and on a beta it is a snapshot.
  if (isRelease(sdkVersion) && compare(sdkVersion, latestSdk ?? '0.0.0') > 0 && compare(floor, sdkVersion) > 0) {
    return { error: `SDK ${floor} is above the SDK being released (${sdkVersion})` };
  }
  return {
    exports: readJson(join(repoRoot, 'packages/sdk/package.json')).exports,
    source: 'unreleased, this tree',
  };
};
const floorExports = (range) => {
  const floor = String(range).match(/^\s*(?:\^|~|>=)?\s*(\d+\.\d+\.\d+)\s*$/)?.[1];
  if (floor === undefined) {
    return { error: `cannot read a lower bound from "${range}"` };
  }
  if (!sdkExports.has(floor)) {
    sdkExports.set(floor, resolveFloor(floor));
  }
  return { floor, ...sdkExports.get(floor) };
};

const failures = [];
for (const { dir, name: pkgName } of consumers) {
  const { peer, subpaths } = packed(dir);
  const peerMajor = majorOf(peer);
  const aligned = peerMajor === sdkMajor;
  console.log(
    `${aligned ? '✓' : '✗'} ${pkgName}: packed peer "${SDK_PEER}@${peer}" vs SDK ${sdkRelease}`,
  );
  if (!aligned) {
    failures.push(
      `${pkgName} will publish "${SDK_PEER}@${peer}" (major ${peerMajor}) ` +
        `but the SDK is ${sdkRelease} (major ${sdkMajor}).`,
    );
  }
  if (subpaths.length > 0) {
    const { floor, exports, source, error } = floorExports(peer);
    const missing = error === undefined ? subpaths.filter((subpath) => !(subpath in exports)) : [];
    const ok = error === undefined && missing.length === 0;
    console.log(
      `${ok ? '✓' : '✗'} ${pkgName}: imports ${subpaths.join(', ')}; oldest accepted SDK ` +
        `${floor ?? '?'}${source ? ` (${source})` : ''}` +
        `${missing.length > 0 ? ` lacks ${missing.join(', ')}` : ''}`,
    );
    if (error !== undefined) {
      failures.push(`${pkgName}: ${error}.`);
    } else if (missing.length > 0) {
      failures.push(
        `${pkgName} imports ${missing.join(', ')} but its peer "${SDK_PEER}@${peer}" ` +
          `accepts SDK ${floor}, which does not export ${missing.length > 1 ? 'them' : 'it'}.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('\nPeer dependency mismatch — refusing to publish stale metadata (OPS-650):');
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}

console.log(`\nAll SDK peer dependencies align with the ${sdkMajor}.x release line.`);
