import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = join(fileURLToPath(import.meta.url), "../../dist");

const RELATIVE_IMPORT = /(from\s+|import\s*\(?)(["'])(\.{1,2}\/[^"']+)\2/g;

const resolve = (fromFile, importPath) => {
  if (/\.[mc]?js$/.test(importPath)) return importPath;
  const base = join(dirname(fromFile), importPath);
  if (existsSync(`${base}.js`)) return `${importPath}.js`;
  if (existsSync(join(base, "index.js"))) return `${importPath}/index.js`;
  return `${importPath}.js`;
};

const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".js")) {
      const src = readFileSync(full, "utf8");
      const patched = src.replace(
        RELATIVE_IMPORT,
        (match, keyword, quote, importPath) => {
          const fixed = resolve(full, importPath);
          return fixed === importPath
            ? match
            : `${keyword}${quote}${fixed}${quote}`;
        },
      );
      if (patched !== src) writeFileSync(full, patched);
    }
  }
};

walk(distDir);
console.log("ESM import extensions patched.");
