# 🧪 theme-ui.macro (Experimental)

This macro is experimental and a work in progress. It aims to provide helpful functionality for developers when creating themes based on the ThemeUI theme spec.

## ℹ️ About

`theme-ui.macro` babel macro transformations for the [ThemeUI theme spec](https://theme-ui.com/theme-spec).

## 📦 Install

**Not yet published to the NPM registry. The following will fail.**

```sh
yarn add theme-ui.macro --dev
```

## ⌨️ Usage

[babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros) must be configured in your project for the macro to do its work.

#### **`./theme.ts`**

```js
import transformTheme from 'theme-ui.macro'

export default transformTheme({
  colors: {
    primary: 'red',
    secondary: 'blue',
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      paddingX: 3,
      paddingY: 2,
    },
    primary: {
      '@apply': 'buttons.base',
      backgroundColor: 'primary',
    },
  },
})

↓ ↓ ↓ ↓ ↓ ↓

export default {
  colors: {
    primary: 'red',
    secondary: 'blue',
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      paddingX: 'var(--space-2)',
      paddingY: 'var(--space-3)',
    },
    primary: {
      paddingX: 'var(--space-2)',
      paddingY: 'var(--space-3)',
      backgroundColor: 'var(--colors-primary)',
    },
  },
}
```

## ⚙️ Configuration

Refer to the documentation for [babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros/blob/master/other/docs/author.md#config) of how to specify configuration for this macro.

The config key is `themeUI`

#### **`babel-plugin-macros.config.js`**

```js
module.exports = {
  themeUI: {
    plugins?: []
  },
}
```

## 🔌 Plugins

### postcss

Generate a stylesheet from the transformed theme.

#### **`./theme.ts`**

```js
import transformTheme from 'theme-ui.macro'

export default transformTheme({
  colors: {
    primary: 'red',
    secondary: 'blue',
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      padding: 2,
    },
    primary: {
      backgroundColor: 'primary',
    },
  },
})
```

#### **`babel-plugin-macros.config.js`**

```js
const postcss = require('theme-ui.macro/plugins/postcss')

module.exports = {
  themeUI: {
    plugins: [
      postcss({
        selectors: {
          buttons: '.button',
        },
        output: './path/to/generated/stylesheet.css',
      }),
    ],
  },
}
```

Should result in a css file being generated like the below.

#### **`./path/to/generated/stylesheet.css`**

```css
:root {
  --colors-primary: red;
  --colors-secondary: blue;
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
}

.button-base {
  padding: var(--space-2);
}

.button-primary {
  background-color: var(--colors-primary);
}
```
