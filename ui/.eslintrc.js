const path = require("path");

module.exports = {
    extends: [
        "mantine",
        "plugin:@next/next/recommended",
        "plugin:jest/recommended",
        "plugin:storybook/recommended"
    ],
    plugins: [ "testing-library", "jest"],
    overrides: [
        {
            files: [ "**/?(*.)+(spec|test).[jt]s?(x)" ],
            extends: [ "plugin:testing-library/react" ]
        }
    ],
    parserOptions: {
        project: path.resolve(__dirname, "tsconfig.json"),
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/quotes": [ "error", "double" ],
        "comma-dangle": [ "error", "never" ],
        "arrow-body-style": [ "off" ],
        "import/order": "off",
        "import/extensions": "off",
        "react/jsx-indent-props": [ "error", 4 ],
        "react/jsx-curly-brace-presence": [ "error", "always" ],
        "react/jsx-tag-spacing": "off",
        "quote-props": "off",
        "@typescript-eslint/no-empty-function": "off"
    },
    ignorePatterns: [ ".eslintrc.js" ]
};