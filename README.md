# 🧪 theme-ui.macro (Experimental)

[![Babel Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg?style=flat-square)](https://github.com/kentcdodds/babel-plugin-macros)
![CI](https://github.com/deckchairlabs/theme-ui.macro/workflows/CI/badge.svg)

This macro is experimental and a work in progress. It aims to provide helpful functionality for developers when creating themes based on the ThemeUI theme spec.

## ℹ️ About

`theme-ui.macro` babel macro transformations for the [ThemeUI theme spec](https://theme-ui.com/theme-spec).

## 📦 Install

```sh
yarn add theme-ui.macro@experimental --dev
```

## ⌨️ Usage

[babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros) must be configured in your project for the macro to do its work.

#### **`./theme.ts`**

```js
import transformTheme from 'theme-ui.macro'

const colors = {
  primary: 'red',
  secondary: 'blue',
}

const scales = {
  space: [0, 4, 8, 16]
}

export default transformTheme({
  colors,
  ...scales,
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

↓ ↓ ↓ ↓ ↓ ↓ result ↓ ↓ ↓ ↓ ↓ ↓

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

```ts
module.exports = {
  themeUI: {
    customProperties?: {
      prefix?: string
    },
    generateStylesheet?: {
      output: string,
      selectors?: Record<string, string>
    },
    generateTSDeclaration?: {
      output: string
    }
  },
}
```

## 🔌 Plugins

### CustomProperties

Turns theme scales into css custom property declarations and makes replacements where neccesary.

#### **`babel-plugin-macros.config.js`**

```js
module.exports = {
  themeUI: {
    customProperties: {
      prefix: 'my-theme',
    },
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
  styles: {
    root: {
      '--my-theme-colors-primary': 'red',
      '--my-theme-colors-secondary': 'blue',
      '--my-theme-colors-dark-primary': 'white',
      '--my-theme-space-0': '0px',
      '--my-theme-space-1': '4px',
      '--my-theme-space-2': '8px',
      '--my-theme-space-3': '16px',
    },
  },
  colors: {
    primary: 'var(--my-theme-colors-primary)',
    secondary: 'var(--my-theme-colors-secondary)',
    dark: {
      primary: 'var(--my-theme-colors-dark-primary)',
    },
  },
  space: [
    'var(--my-theme-space-0)',
    'var(--my-theme-space-1)',
    'var(--my-theme-space-2)',
    'var(--my-theme-space-3)',
  ],
  buttons: {
    base: {
      padding: 2,
    },
    primary: {
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
      padding: [2, 3],
    },
    primary: {
      backgroundColor: 'primary',
    },
  },
})
```

#### **`babel-plugin-macros.config.js`**

```js
module.exports = {
  themeUI: {
    generateStylesheet: {
      selectors: {
        buttons: '.button',
      },
      output: './path/to/generated/stylesheet.css',
    },
  },
}
```

Should result in a css file being generated like the below.

#### **`./path/to/generated/stylesheet.css`**

```css
.button-base {
  padding: 8px;
}

@media screen and (min-width: 40em) {
  .button-base {
    padding: 16px;
  }
}

.button-primary {
  background-color: red;
}

/**
 * With the CustomProperties plugin
 */
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

@media screen and (min-width: 40em) {
  .button-base {
    padding: var(--space-3);
  }
}

.button-primary {
  background-color: var(--colors-primary);
}
```

### TypescriptDeclaration

Generate a TypeScript declaration file from the transformed theme.

#### **`babel-plugin-macros.config.js`**

```js
module.exports = {
  themeUI: {
    generateTSDeclaration: {
      output: './path/to/generated/theme.d.ts',
    },
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

Should result in a TypeScript declaration file being generated like the below.

#### **`./path/to/generated/theme.d.ts`**

```ts
import { Theme } from '@theme-ui/css'
declare module '@theme-ui/css' {
  export interface Theme {
    colors: {
      primary: 'red'
      secondary: 'blue'
    }
    space: [0, 4, 8, 16]
    buttons: {
      base: {
        padding: 2
      }
      primary: {
        backgroundColor: 'primary'
      }
    }
  }
}
```
