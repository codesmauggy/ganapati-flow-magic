// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `bun run build:spa` produces a static bundle (SPA shell + hashed assets) that
// Django/nginx can serve with a catch-all fallback and no Node server.
// The default build keeps the Lovable hosting server entry untouched.
const spaBuild = process.env.SPA_BUILD === "1";

// Public prefix the production assets are served from. Root by default; set
// SPA_BASE=/static/erp/ when Django serves the bundle from a static prefix so
// every asset URL (including lazy route chunks) is emitted with that prefix.
const spaBase = `/${(process.env.SPA_BASE ?? "").replace(/^\/+|\/+$/g, "")}/`.replace(/\/{2,}/g, "/");

export default defineConfig({
  // The static bundle needs no server runtime — skip nitro so the SPA shell is
  // prerendered from Vite's own SSR output.
  nitro: spaBuild 
    ? false 
    : { preset: 'node-server' },
  vite: spaBuild ? { base: spaBase } : {},
  tanstackStart: spaBuild
    ? {
        // Emits dist/client/_shell.html — the shell used as Django's fallback.
        spa: { enabled: true },
      }
    : {
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        // nitro/vite builds from this
        server: { entry: "server" },
      },
});
