# tslint-react-native

This package includes TSLint rules for React Native development

## Available rules

- `no-unused-styles` shows unused styles created with `StyleSheet.create`

## Usage

1. Install as dev dependency with `npm i -D tslint-react-native`
2. In your `tslint.json` add `tslint-react-native` as array item to `extends`
3. Enable the rules you want like in code example below

```json
{
  "extends": [/* other rule sets */, "tslint-react-native"],
  "rules": {
    /* other rules */
    "no-unused-styles": true
  }
}
```