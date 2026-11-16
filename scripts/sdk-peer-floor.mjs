/**
 * The exports of the oldest SDK a consumer's peer range accepts, for
 * verify-sdk-peer.mjs. Pure apart from the injected `npmView`, so it is tested
 * on its own (scripts/__tests__/sdk-peer-floor.test.mjs).
 *
 * - A stable range (`^3.8.0`, `~3.8.0`, `>=3.8.0`, `3.8.0`): the floor's
 *   exports from npm. A floor npm lacks is accepted only when it is above
 *   npm's `latest`, i.e. the next release, checked against this tree's SDK,
 *   and not above a released SDK version this tree carries. Any other missing
 *   floor (a typo, a skipped version) fails.
 * - An exact prerelease peer (`0.0.0-beta-20261116181952`, written by
 *   `changeset version --snapshot`): accepted only when it is this tree's SDK
 *   version, and checked against this tree's SDK exports, the ones the
 *   snapshot publishes. Any other prerelease peer fails.
 */

const SDK = '@askdialog/dialog-sdk';
const STABLE_RANGE = /^\s*(?:\^|~|>=)?\s*(\d+\.\d+\.\d+)\s*$/;
const PRERELEASE = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/;

const compare = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(/[.-]/).slice(0, 3).map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};
const isRelease = (version) => /^\d+\.\d+\.\d+$/.test(version);

/**
 * @param {object} options
 * @param {string} options.sdkVersion this tree's packages/sdk version
 * @param {() => Record<string, unknown>} options.localExports this tree's packages/sdk exports
 * @param {(spec: string, field: string) => unknown} options.npmView the field, or undefined on E404
 * @returns {(range: string) => { floor?: string, exports?: Record<string, unknown>, source?: string, error?: string }}
 */
export const createFloorResolver = ({ sdkVersion, localExports, npmView }) => {
  let latestSdk;
  const resolved = new Map();

  const resolveStable = (floor) => {
    const published = npmView(`${SDK}@${floor}`, 'exports');
    if (published !== undefined) {
      return { exports: published, source: 'npm' };
    }
    latestSdk ??= npmView(SDK, 'version');
    if (latestSdk !== undefined && compare(floor, latestSdk) <= 0) {
      return { error: `SDK ${floor} is not on npm (latest ${latestSdk})` };
    }
    // The tree carries a released version after `changeset version`; on
    // staging it is stale and on a beta it is a snapshot.
    if (
      isRelease(sdkVersion) &&
      compare(sdkVersion, latestSdk ?? '0.0.0') > 0 &&
      compare(floor, sdkVersion) > 0
    ) {
      return { error: `SDK ${floor} is above the SDK being released (${sdkVersion})` };
    }
    return { exports: localExports(), source: 'unreleased, this tree' };
  };

  const resolve = (range) => {
    const peer = String(range).trim();
    if (PRERELEASE.test(peer)) {
      return peer === sdkVersion
        ? { floor: peer, exports: localExports(), source: 'snapshot, this tree' }
        : { floor: peer, error: `prerelease peer ${peer} is not this tree's SDK (${sdkVersion})` };
    }
    const floor = peer.match(STABLE_RANGE)?.[1];
    if (floor === undefined) {
      return { error: `cannot read a lower bound from "${range}"` };
    }
    return { floor, ...resolveStable(floor) };
  };

  return (range) => {
    if (!resolved.has(range)) {
      resolved.set(range, resolve(range));
    }
    return resolved.get(range);
  };
};

/** The imported subpaths the resolved floor does not export. */
export const missingSubpaths = (subpaths, exports) =>
  subpaths.filter((subpath) => !(subpath in (exports ?? {})));
