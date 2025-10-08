module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    // project defaults
    'no-undef': 'off',
    'no-console': 'off',
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }]
  },
  overrides: [
    {
      files: ['scripts/**/*.js', 'scripts/**/*.cjs'],
      env: { node: true },
      parserOptions: {
        sourceType: 'script'
      },
      rules: {
        'linebreak-style': 'off',
        'no-console': 'off',
        'no-process-exit': 'off'
      }
    }
    ,
    {
      // relax module parsing for .mjs and ESM test files
      files: ['scripts/**/*.mjs', 'src/**/*.mjs'],
      parserOptions: {
        sourceType: 'module'
      },
      env: { node: true }
    },
    {
      // keep react/browser rules for src files
      files: ['src/**/*.js', 'src/**/*.jsx'],
      env: { browser: true, node: false },
      parserOptions: {
        sourceType: 'module'
      }
    }
  ]
};
