import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // the lesson tests cover the draft lessons too (ADR 0018); tests/tutorial/display.test.ts checks the gate itself
    env: { NEXT_PUBLIC_SHOW_DRAFT_LESSONS: "1" },
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**", "src/catalog/**", "src/parsers/**", "src/editor/**", "src/tutorial/**", "src/persistence/**"],
    },
  },
});
