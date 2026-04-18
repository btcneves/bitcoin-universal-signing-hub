module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'security'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:security/recommended', 'prettier'],
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  ignorePatterns: ['dist', 'build', '.turbo', 'node_modules'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
