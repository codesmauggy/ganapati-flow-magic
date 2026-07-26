// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Client-only SPA: the app is served as a static shell + JS bundle and every
    // route renders in the browser. All data comes from the Django REST API, so
    // there is nothing to render on the server.
    spa: {
      enabled: true,
      // The prerendered shell that every URL falls back to (like index.html).
      maskPath: "/",
      prerender: { enabled: true, crawlLinks: false },
    },
    // No custom server entry in SPA mode: there is no SSR request path to wrap,
    // and the shell prerender step needs the framework's default entry.
  },
});


