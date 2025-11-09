// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/dist/**', 'eslint.config.mjs']
  },
  {
    files: ['src/**/*.ts'],
    extends: [eslint.configs.recommended,
      ...tseslint.configs.recommended
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    }
  }
)
