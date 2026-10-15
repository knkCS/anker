import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false,
    passWithNoTests: true,
    // Node 25 defines a global `localStorage` that only works with
    // `--localstorage-file`, and jsdom does not replace a global that already
    // exists, so tests would see Node's half-working object. With Node's Web
    // Storage off, jsdom's `localStorage` is the one in place on every Node,
    // as on CI (Node 22). Accepted by Node 22.4 and later (knkCS/odon#350).
    poolOptions: {
      forks: { execArgv: ["--no-experimental-webstorage"] },
    },
  },
});
