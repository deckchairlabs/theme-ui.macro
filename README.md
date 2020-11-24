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
      paddingX: 3,
      paddingY: 2,
    },
    primary: {
      paddingX: 3,
      paddingY: 2,
      backgroundColor: 'primary',
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

### CustomProperties

Turns theme tokens into css custom property declarations and make replacements where neccesary.

#### **`babel-plugin-macros.config.js`**

```js
const customProperties = require('theme-ui.macro/plugins/customProperties')

module.exports = {
  themeUI: {
    plugins: [customProperties()],
  },
}
```

#### **`./theme.ts`**

```js
import transformTheme from 'theme-ui.macro'

export default transformTheme({
  colors: {
    primary: 'red',
    secondary: 'blue',
    dark: {
      primary: 'white'
    }
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

↓ ↓ ↓ ↓ ↓ ↓ result ↓ ↓ ↓ ↓ ↓ ↓

export default {
  ':custom-properties': {
    '--colors-primary': 'red',
    '--colors-secondary': 'blue',
    '--colors-dark-primary': 'white',
    '--space-0': '0px',
    '--space-1': '4px',
    '--space-2': '8px',
    '--space-3': '16px',
  },
  colors: {
    primary: 'var(--colors-primary)',
    secondary: 'var(--colors-secondary)',
    dark: {
      primary: 'var(--colors-dark-primary)',
    },
  },
  space: [
    'var(--space-0)',
    'var(--space-1)',
    'var(--space-2)',
    'var(--space-3)',
  ],
  buttons: {
    base: {
      paddingX: 3,
      paddingY: 2,
    },
    primary: {
      paddingX: 3,
      paddingY: 2,
      backgroundColor: 'primary',
    },
  },
}
```

### GenerateStylesheet

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
const generateStylesheet = require('theme-ui.macro/plugins/generateStylesheet')

module.exports = {
  themeUI: {
    plugins: [
      generateStylesheet({
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
.button-base {
  padding: 8px;
}

.button-primary {
  background-color: red;
}
```
