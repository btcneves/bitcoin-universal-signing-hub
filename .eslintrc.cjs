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
    '@typescript-eslint/no-explicit-any': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.property.name='setItem'] > Literal:first-child[value=/seed|mnemonic|passphrase|privateKey/i]",
        message: 'Nunca persista seed/mnemonic/passphrase/chave privada em storage.'
      }
    ]
  },
  overrides: [
    {
      files: [
        'packages/bitcoin-engine/src/**/*.ts',
        'packages/psbt-engine/src/**/*.ts',
        'packages/lightning-engine/src/**/*.ts',
        'packages/security-core/src/**/*.ts'
      ],
      rules: {
        'no-console': 'error'
      }
    }
  ]
};
