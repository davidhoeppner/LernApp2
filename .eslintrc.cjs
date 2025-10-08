module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
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
      rules: {
        'linebreak-style': 'off',
        'no-console': 'off',
        'no-process-exit': 'off'
      }
    }
  ]
};
