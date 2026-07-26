#!/usr/bin/env node
/**
 * Builds a plain static SPA bundle that Django (or nginx) can serve directly.
 *
 * Input : dist/client  (produced by `vite build`)
 * Output: dist/spa     (index.html shell + hashed assets, ready to copy into
 *                       Django's STATICFILES_DIRS / collectstatic target)
 *
 * Asset URLs are rewritten with SPA_BASE so the bundle works both at the domain
 * root ("/") and under a static prefix such as "/static/erp/".
 *
 *   SPA_BASE=/static/erp/ node scripts/build-spa.mjs
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "dist/client");
const SERVER_DIR = path.join(ROOT, "dist/server");
const OUT_DIR = path.join(ROOT, "dist/spa");

// Public prefix the assets are served from. Always ends with a single slash.
const BASE = `/${(process.env.SPA_BASE ?? "/").replace(/^\/+|\/+$/g, "")}/`.replace(
  /\/{2,}/g,
  "/",
);

const APP_TITLE = "Manish Kala Kendra ERP";
const APP_DESCRIPTION =
  "Workshop ERP for Manish Kala Kendra: stock, wholesale and retail bookings, customers, staff piece-rate wages and expenses.";

function withBase(url) {
  return `${BASE}${String(url).replace(/^\/+/, "")}`;
}

async function findManifest() {
  const files = await readdir(SERVER_DIR).catch(() => []);
  const name = files.find(
    (f) => f.startsWith("_tanstack-start-manifest_v-") && f.endsWith(".mjs"),
  );
  return name ? path.join(SERVER_DIR, name) : null;
}

async function resolveEntry() {
  // Preferred: read the router manifest emitted by the build.
  const manifestPath = await findManifest();
  if (manifestPath) {
    const source = await readFile(manifestPath, "utf8");
    const rootBlock = source.slice(source.indexOf("__root__"));
    const scripts = [...rootBlock.matchAll(/src:\s*"([^"]+\.js)"/g)].map((m) => m[1]);
    const preloads = [...rootBlock.matchAll(/"(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
    if (scripts.length) {
      return {
        entry: scripts[0],
        preloads: [...new Set(preloads)].slice(0, 6),
      };
    }
  }

  // Fallback: guess the entry chunk from the assets folder.
  const assets = await readdir(path.join(CLIENT_DIR, "assets"));
  const entry = assets.find((f) => /^index-.*\.js$/.test(f));
  if (!entry) {
    throw new Error(
      "Could not determine the client entry chunk. Run `vite build` before this script.",
    );
  }
  return { entry: `/assets/${entry}`, preloads: [] };
}

async function findStylesheets() {
  const assets = await readdir(path.join(CLIENT_DIR, "assets"));
  return assets.filter((f) => f.endsWith(".css")).map((f) => `/assets/${f}`);
}

const { entry, preloads } = await resolveEntry();
const stylesheets = await findStylesheets();

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await cp(CLIENT_DIR, OUT_DIR, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${APP_TITLE}</title>
    <meta name="description" content="${APP_DESCRIPTION}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${APP_TITLE}" />
    <meta property="og:description" content="${APP_DESCRIPTION}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="${withBase("favicon.ico")}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Marcellus&family=Inter:wght@400;500;600;700&display=swap"
    />
${stylesheets.map((href) => `    <link rel="stylesheet" href="${withBase(href)}" />`).join("\n")}
${preloads
  .filter((href) => href !== entry)
  .map((href) => `    <link rel="modulepreload" href="${withBase(href)}" />`)
  .join("\n")}
    <script type="module" crossorigin src="${withBase(entry)}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

await writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");
// Same file doubles as the Django template for the catch-all route.
await writeFile(path.join(OUT_DIR, "200.html"), html, "utf8");

console.log(`SPA bundle written to dist/spa (base "${BASE}")`);
console.log(`  entry: ${withBase(entry)}`);
for (const href of stylesheets) console.log(`  css:   ${withBase(href)}`);
