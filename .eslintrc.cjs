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
    'no-restricted-properties': [
      'error',
      { object: 'localStorage', property: 'setItem', message: 'Persistência local bloqueada para payloads sensíveis.' },
      { object: 'sessionStorage', property: 'setItem', message: 'Persistência de sessão bloqueada para payloads sensíveis.' },
      { object: 'indexedDB', property: 'open', message: 'IndexedDB não permitido para fluxos sensíveis.' },
      { object: 'caches', property: 'open', message: 'Cache API persistente não permitida para dados sensíveis.' }
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'redux-persist', message: 'Persistência automática de estado é bloqueada por política de segurança.' },
          { name: 'zustand/middleware', importNames: ['persist'], message: 'zustand persist é bloqueado por política de segurança.' },
          { name: 'localforage', message: 'Armazenamento persistente é bloqueado para este projeto.' },
          { name: 'idb-keyval', message: 'IndexedDB helper bloqueado por política de segurança.' }
        ]
      }
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='setItem']",
        message: 'Não use APIs de persistência para material de wallet/secrets.'
      },
      {
        selector: "CallExpression[callee.property.name='stringify'] Identifier[name=/seed|mnemonic|passphrase|privateKey|secret/i]",
        message: 'Serialização de segredos bloqueada (telemetria/log/erro).'
      }
    ]
  },
  overrides: [
    {
      files: [
        'packages/bitcoin-engine/src/**/*.ts',
        'packages/psbt-engine/src/**/*.ts',
        'packages/lightning-engine/src/**/*.ts',
        'packages/security-core/src/**/*.ts',
        'apps/web/src/**/*.ts',
        'apps/web/src/**/*.tsx'
      ],
      rules: {
        'no-console': 'error'
      }
    }
  ]
};
