# 🧪 theme-ui.macro (Experimental)

This macro is experimental and a work in progress. It aims to provide helpful functionality for developers when creating themes based on the ThemeUI theme spec.

## ℹ️ About

`theme-ui.macro` babel macro transformations for the [ThemeUI theme spec](https://theme-ui.com/theme-spec).

## 📦 Install

```sh
yarn add theme-ui.macro --dev
```

## ⌨️ Usage

[babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros) must be configured in your project for the macro to do its work.

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

TODO
