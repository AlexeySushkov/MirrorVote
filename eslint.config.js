import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'supabase/functions', // Deno — lint with `deno lint`
      'src/integrations/supabase/types.ts', // generated
      // local-only folders (gitignored)
      'Landing*',
      'doc',
      'selectel',
      'y-kassa',
      'nginx',
      'test*',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // shadcn primitives export variants; contexts export their hooks next to the provider
    files: ['src/components/ui/**', 'src/contexts/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
