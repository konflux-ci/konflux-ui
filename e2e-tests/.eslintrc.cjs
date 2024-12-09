module.exports = {
  env: {
    "cypress/globals": true,
    "node": true
  },
  extends: [
    "../.eslintrc.cjs",
    "plugin:cypress/recommended",
    "plugin:cypress/recommended"
  ],
  plugins: [
    "cypress"
  ],
  rules: {
    "no-console": "off",
    "no-namespace": "off",
    "no-redeclare": "off",
    "promise/catch-or-return": "off",
    "promise/no-nesting": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "cypress/no-unnecessary-waiting": "off"
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ],
        "moduleDirectory": [
          "node_modules",
          "e2e-tests/"
        ]
      }
    }
  }
};