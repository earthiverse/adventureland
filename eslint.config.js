// @ts-check
import ESLintJs from "@eslint/js";
import TypescriptESLintParser from "@typescript-eslint/parser";
import ESLintPluginVue from "eslint-plugin-vue";
import Globals from "globals";
import TypescriptESLint from "typescript-eslint";
import VueEslintParser from "vue-eslint-parser";

export default TypescriptESLint.config(
  ESLintJs.configs.recommended,
  ...TypescriptESLint.configs.recommendedTypeChecked,
  ...ESLintPluginVue.configs["flat/essential"],
  // Generated Code
  {
    ignores: ["**/dist/*"],
  },
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
  // Game
  {
    files: ["packages/game/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["packages/game/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/game/**/*.vue"],
    languageOptions: {
      parser: VueEslintParser,
      parserOptions: {
        parser: TypescriptESLintParser,
      },
    },
    extends: [TypescriptESLint.configs.disableTypeChecked],
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
    extends: [TypescriptESLint.configs.disableTypeChecked],
  },
  // We're running everything using NodeJS
  {
    languageOptions: {
      globals: {
        ...Globals.node,
      },
    },
  },
);
