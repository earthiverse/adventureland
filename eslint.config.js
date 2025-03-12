// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Central Server
  {
    files: ["packages/central-server/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["packages/central-server/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  // Game Server
  {
    files: ["packages/game-server/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["packages/game-server/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  // Types
  {
    files: ["packages/types/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["packages/types/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  // Check JS files in services
  {
    files: ["packages/**/*.js", "services/**/*.js", "*.js"],
    ignores: ["services/**/data/*"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // We're running everything using NodeJS
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
