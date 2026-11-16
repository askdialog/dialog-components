import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFloorResolver, missingSubpaths } from '../sdk-peer-floor.mjs';

// npm as of SDK 3.8.0: /impressions since 3.7.0, /events since 3.8.0.
const ROOT = { '.': {} };
const NPM = {
  '3.4.0': { ...ROOT },
  '3.7.0': { ...ROOT, './impressions': {} },
  '3.8.0': { ...ROOT, './impressions': {}, './events': {} },
};
const npmView = (spec, field) => {
  if (field === 'version') {
    return '3.8.0';
  }
  return NPM[spec.split('@').pop()];
};
const TREE = { ...ROOT, './impressions': {}, './events': {} };
const IMPORTS = ['./events', './impressions'];

const check = (range, { sdkVersion = '3.3.0', localExports = TREE } = {}) => {
  const result = createFloorResolver({ sdkVersion, localExports: () => localExports, npmView })(range);
  return { ...result, missing: result.error ? undefined : missingSubpaths(IMPORTS, result.exports) };
};

describe('stable peer ranges', () => {
  it('reads the floor of ^, ~, >= and an exact version from npm', () => {
    for (const range of ['^3.8.0', '~3.8.0', '>=3.8.0', '3.8.0']) {
      assert.deepEqual(check(range), { floor: '3.8.0', exports: NPM['3.8.0'], source: 'npm', missing: [] });
    }
  });

  it('reports the subpaths an older floor lacks (react@3.5.0 shipped with ^3.4.0)', () => {
    assert.deepEqual(check('^3.4.0').missing, ['./events', './impressions']);
    assert.deepEqual(check('^3.7.0').missing, ['./events']);
  });

  it('fails a floor npm lacks at or below latest', () => {
    assert.match(check('^3.6.5').error, /SDK 3\.6\.5 is not on npm \(latest 3\.8\.0\)/);
  });

  it('checks a floor above latest against the tree, unless above the SDK being released', () => {
    assert.equal(check('^3.9.0').source, 'unreleased, this tree');
    assert.equal(check('^3.9.0', { sdkVersion: '3.9.0' }).source, 'unreleased, this tree');
    assert.match(check('^3.9.0', { sdkVersion: '3.8.1' }).error, /above the SDK being released \(3\.8\.1\)/);
  });

  it('does not read the tree for a stable floor npm has, even on a snapshot', () => {
    const snapshot = '0.0.0-beta-20261116181952';
    assert.equal(check('^3.4.0', { sdkVersion: snapshot, localExports: TREE }).missing.length, 2);
  });
});

describe('exact snapshot peers', () => {
  const snapshot = '0.0.0-beta-20261116181952';

  it("checks the tree's SDK exports when the peer is this tree's snapshot", () => {
    assert.deepEqual(check(snapshot, { sdkVersion: snapshot }), {
      floor: snapshot,
      exports: TREE,
      source: 'snapshot, this tree',
      missing: [],
    });
  });

  it("reports the subpaths the tree's snapshot does not export", () => {
    const result = check(snapshot, { sdkVersion: snapshot, localExports: { ...ROOT, './impressions': {} } });
    assert.deepEqual(result.missing, ['./events']);
  });

  it('fails a snapshot peer that is not this tree’s SDK', () => {
    assert.match(
      check('0.0.0-beta-20261116000000', { sdkVersion: snapshot }).error,
      /prerelease peer 0\.0\.0-beta-20261116000000 is not this tree's SDK/,
    );
    assert.match(check(snapshot, { sdkVersion: '3.8.0' }).error, /is not this tree's SDK \(3\.8\.0\)/);
  });

  it('does not read a prerelease range as a floor', () => {
    assert.match(check('^3.9.0-beta.1', { sdkVersion: '3.9.0-beta.1' }).error, /cannot read a lower bound/);
  });
});
