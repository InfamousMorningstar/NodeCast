import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitignorePath = path.resolve(__dirname, '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
const gitignorePatterns = gitignoreContent
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((pattern) => pattern.trim());

export default tseslint.config(
  { ignores: gitignorePatterns },

  {
    extends: [
      tseslint.configs.recommended,
      reactHooksPlugin.configs['recommended-latest'],
      reactRefreshPlugin.configs.vite,
    ],
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      prettier: prettier,
      react: reactPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,

      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {},
        {
          fileInfoOptions: {
            withNodeModules: false,
          },
        },
      ],

      'linebreak-style': 'off', // Disabled for Windows development
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      semi: ['error', 'always'],
      'jsx-quotes': ['error', 'prefer-single'],
      indent: 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/no-danger-with-children': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'warn',
      'react/no-is-mounted': 'warn',
      'react/no-typos': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/require-render-return': 'error',
      'react/style-prop-object': 'warn',
      'jsx-a11y/alt-text': 'off',
      'react/display-name': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
);
