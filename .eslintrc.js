const base = require('@open-web3/dev-config/config/eslint.cjs');

module.exports = {
  ...base,
  parserOptions: {
    ...base.parserOptions,
    project: ['./tsconfig.json']
  },
  rules: {
    ...base.rules,
    '@typescript-eslint/indent': 'off', // prettier
    'space-before-function-paren': 'off', // prettier
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'no-useless-constructor': 'off',
    'header/header': 'off',
    'sort-keys': 'off',
    'comma-dangle': 'off',
    'padding-line-between-statements': 'off'
  }
};
