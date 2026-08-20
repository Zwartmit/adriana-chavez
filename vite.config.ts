// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Passed through to the underlying Vite config via mergeConfig — does not
  // touch the managed plugins array. Splits the client bundle into smaller
  // vendor chunks for a lighter initial load.
  //
  // This project builds with Vite's Rolldown engine, whose manualChunks only
  // accepts a function (the classic Rollup object-map shorthand throws).
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (/[\\/](react|react-dom)[\\/]/.test(id)) return "vendor-react";
            if (id.includes("@tanstack/react-router")) return "vendor-router";
            if (id.includes("@supabase/supabase-js")) return "vendor-supabase";
            if (id.includes("recharts")) return "vendor-recharts";
            if (/[\\/](lucide-react|embla-carousel-react)[\\/]/.test(id)) return "vendor-ui";
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  },
});
