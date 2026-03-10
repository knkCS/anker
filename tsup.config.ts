import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "theme/index": "src/theme/index.ts",
    "primitives/index": "src/primitives/index.ts",
    "components/index": "src/components/index.ts",
    "atoms/index": "src/atoms/index.ts",
    "forms/index": "src/forms/index.ts",
    "feedback/index": "src/feedback/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@chakra-ui/react",
    "react-hook-form",
    "@hookform/resolvers",
    "zod",
    "react-router-dom",
    "react-i18next",
  ],
  treeshake: true,
  sourcemap: true,
  minify: false,
});
