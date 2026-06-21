import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The codebase widely uses the "sync state from props / one-shot mount"
      // effect pattern. Keep this strict perf hint visible without failing builds.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
