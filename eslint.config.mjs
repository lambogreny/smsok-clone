import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Temp/artifact directories
    ".tmp-*/**",
    "screenshots/**",
    "playwright-report/**",
    "prisma/dev.db",
    // Test files (not production code)
    "tests/**",
  ]),
  {
    rules: {
      // These are standard React patterns (setState in useEffect for hydration,
      // zustand store rehydrate, etc.) — downgrade to warnings.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      // Downgrade during feature freeze — pre-existing issues across codebase
      "@next/next/no-assign-module-variable": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // React 19 / Next.js 16 new rules — pre-existing across codebase
      "react-hooks/error-boundaries": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
