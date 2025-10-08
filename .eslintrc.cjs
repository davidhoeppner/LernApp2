module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    // project defaults
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
