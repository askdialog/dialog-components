// Emits the CommonJS build `require` resolves to, next to the ESM build in dist/.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const OUT = "dist/cjs";

execFileSync("tsc", ["-p", "tsconfig.cjs.json"], { stdio: "inherit" });

// A source file's require of a file outside src (../package.json) is one level
// deeper in dist/cjs than in src: re-point it at the same file.
const rewrite = (file) => {
  const source = resolve("src", relative(OUT, file));
  const code = readFileSync(file, "utf8");
  const fixed = code.replace(
    /require\("(\.\.?\/[^"]+\.json)"\)/g,
    (_, path) => {
      const target = resolve(dirname(source), path);
      const next = relative(dirname(file), target);
      return `require("${next.startsWith(".") ? next : `./${next}`}")`;
    },
  );
  if (fixed !== code) {
    writeFileSync(file, fixed);
  }
};

const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
    } else if (path.endsWith(".js")) {
      rewrite(path);
    }
  }
};

walk(OUT);
writeFileSync(
  join(OUT, "package.json"),
  `${JSON.stringify({ type: "commonjs" })}\n`,
);
