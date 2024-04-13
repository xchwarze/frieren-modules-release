module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'node'
  ],
  rules: {
  }
};
