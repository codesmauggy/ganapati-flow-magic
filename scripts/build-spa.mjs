#!/usr/bin/env node
/**
 * Post-processes the `SPA_BUILD=1 vite build` output into a plain static bundle
 * that Django (or nginx) can serve directly — no Node server in production.
 *
 * Input : dist/client            (hashed assets + prerendered `_shell.html`)
 * Output: dist/spa/index.html    (SPA fallback shell, also copied to 200.html)
 *         dist/spa/assets/**     (hashed JS/CSS)
 *
 * Asset URLs come from Vite's `base`, set via SPA_BASE at build time
 * (see vite.config.ts). Run through `bun run build:spa`.
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist/client");
const OUT_DIR = path.join(ROOT, "dist/spa");

const files = await readdir(CLIENT_DIR).catch(() => {
  throw new Error("dist/client is missing — run `bun run build:spa` (not a bare node call).");
});

const shellName = ["_shell.html", "index.html", "200.html"].find((c) => files.includes(c));
if (!shellName) {
  throw new Error(
    "No prerendered shell in dist/client. The build must run with SPA_BUILD=1 so " +
      "TanStack Start emits the SPA shell.",
  );
}

const shell = await readFile(path.join(CLIENT_DIR, shellName), "utf8");

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await cp(CLIENT_DIR, OUT_DIR, { recursive: true });
await rm(path.join(OUT_DIR, "_shell.html"), { force: true });
await rm(path.join(OUT_DIR, "_headers"), { force: true });

// index.html doubles as Django's catch-all template; 200.html covers hosts that
// use that convention (Surge/Netlify style).
await writeFile(path.join(OUT_DIR, "index.html"), shell, "utf8");
await writeFile(path.join(OUT_DIR, "200.html"), shell, "utf8");

const assets = await readdir(path.join(OUT_DIR, "assets")).catch(() => []);
const scriptSrc = shell.match(/<script[^>]+src="([^"]+)"/)?.[1] ?? "(none)";

console.log("SPA bundle ready:");
console.log(`  dist/spa/index.html   (fallback shell, from ${shellName})`);
console.log(`  dist/spa/assets/      (${assets.length} hashed files)`);
console.log(`  entry script          ${scriptSrc}`);
console.log("Copy dist/spa into Django's static dir and point the catch-all route at index.html.");
