module.exports = {
  plugins: ["@typescript-eslint", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array
    "@react-native-community",
    "prettier/@typescript-eslint",
    "prettier",
  ],
  rules: {
    "react/no-did-update-set-state": "off",
    "prefer-const": ["error", {
      "destructuring": "all",
    }],
    "prettier/prettier": ["warn"],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "ignoreRestSiblings": true, argsIgnorePattern: "^_" }],
    "@typescript-eslint/ban-ts-ignore": "off",
    "no-shadow": "off",
    "radix": "off",
    "no-undef": "off",
    "@typescript-eslint/no-inferrable-types": [
      "warn",
      {
        "ignoreParameters": true
      }
    ]
  },
};
