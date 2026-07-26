// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `SPA_BUILD=1 bun run build:spa` produces a static bundle (shell index.html +
// hashed assets) that Django/nginx can serve with a catch-all fallback.
// The default build keeps the Lovable hosting server entry.
const spaBuild = process.env.SPA_BUILD === "1";

export default defineConfig({
  tanstackStart: spaBuild
    ? {
        // Emits dist/client/index.html — the SPA shell used as Django's fallback.
        spa: { enabled: true },
      }
    : {
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        // nitro/vite builds from this
        server: { entry: "server" },
      },
});
