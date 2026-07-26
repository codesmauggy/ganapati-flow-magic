#!/usr/bin/env node
/**
 * Post-processes `SPA_BUILD=1 vite build` output into a plain static bundle that
 * Django (or nginx) can serve directly — no Node server in production.
 *
 * Input : dist/client              (assets + prerendered `_shell.html`)
 * Output: dist/spa/index.html      (SPA fallback shell, also copied to 200.html)
 *         dist/spa/assets/**       (hashed JS/CSS)
 *
 * Asset URLs are absolute and default to the domain root. Serving the bundle
 * from a static prefix instead? Pass the prefix so every URL is rewritten:
 *
 *   SPA_BASE=/static/erp/ node scripts/build-spa.mjs
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist/client");
const OUT_DIR = path.join(ROOT, "dist/spa");

// Normalised public prefix: always starts and ends with exactly one slash.
const BASE = `/${(process.env.SPA_BASE ?? "").replace(/^\/+|\/+$/g, "")}/`.replace(/\/{2,}/g, "/");

async function readShell() {
  const candidates = ["_shell.html", "index.html", "200.html"];
  const files = await readdir(CLIENT_DIR).catch(() => {
    throw new Error("dist/client is missing — run `SPA_BUILD=1 vite build` first.");
  });
  const name = candidates.find((c) => files.includes(c));
  if (!name) {
    throw new Error(
      "No prerendered shell found in dist/client. Ensure the build ran with SPA_BUILD=1 " +
        "so TanStack Start emits the SPA shell.",
    );
  }
  return { name, html: await readFile(path.join(CLIENT_DIR, name), "utf8") };
}

const { name, html } = await readShell();

// Rewrite root-absolute asset URLs (src/href/from/import specifiers) onto BASE.
const rebased =
  BASE === "/"
    ? html
    : html.replace(/(["'(])\/(assets\/|favicon\.ico)/g, (_m, quote, rest) => `${quote}${BASE}${rest}`);

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await cp(CLIENT_DIR, OUT_DIR, { recursive: true });
await rm(path.join(OUT_DIR, "_shell.html"), { force: true });

// index.html doubles as the Django catch-all template (and 200.html for hosts
// that use that convention).
await writeFile(path.join(OUT_DIR, "index.html"), rebased, "utf8");
await writeFile(path.join(OUT_DIR, "200.html"), rebased, "utf8");

const assets = await readdir(path.join(OUT_DIR, "assets")).catch(() => []);
console.log(`SPA bundle ready in dist/spa (shell: ${name}, asset base: "${BASE}")`);
console.log(`  ${assets.length} hashed assets`);
console.log(`  fallback: dist/spa/index.html`);
