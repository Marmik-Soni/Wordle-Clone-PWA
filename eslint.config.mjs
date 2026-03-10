import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'dist/**']),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript (plugin already registered by eslint-config-next)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-explicit-any': 'warn',

      // General
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prettier — disable conflicting formatting rules, then enforce prettier
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
]);

export default eslintConfig;
