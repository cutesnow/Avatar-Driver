import globals from "globals";
import tseslint from "typescript-eslint";

globalThis.structuredClone ??= (value) => JSON.parse(JSON.stringify(value));

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "public/wasm", "public/workers"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.worker,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
