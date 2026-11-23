// Checks that every built package's declared entries exist and that CommonJS
// consumers can require them, as a Node or Jest project would.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PACKAGES = ['packages/sdk', 'packages/react', 'packages/vue'];

const targets = (value) =>
  typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(targets);

const failures = [];
for (const dir of PACKAGES) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (!existsSync(join(dir, 'dist'))) {
    console.log(`skip ${manifest.name}: not built`);
    continue;
  }
  const files = [manifest.main, manifest.module, manifest.types, ...targets(manifest.exports)].filter(Boolean);
  for (const file of new Set(files)) {
    if (!existsSync(join(dir, file))) {
      failures.push(`${manifest.name}: ${file} is declared but not built`);
    }
  }
  // Self-reference resolves the package's own exports map, its require condition included.
  const require = createRequire(join(process.cwd(), dir, 'package.json'));
  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    if (typeof value === 'string' && !value.endsWith('.js') && !value.endsWith('.cjs')) {
      continue;
    }
    const specifier = subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
    try {
      const loaded = require(specifier);
      if (Object.keys(loaded).length === 0) {
        failures.push(`${specifier}: required with no exports`);
      } else {
        console.log(`ok ${specifier} (${Object.keys(loaded).length} exports)`);
      }
    } catch (error) {
      failures.push(`${specifier}: ${error.code ?? ''} ${error.message.split('\n')[0]}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
