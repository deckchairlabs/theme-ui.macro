export default {
  ':custom-properties': {
    '--colors-primary': 'red',
    '--colors-secondary': 'blue',
    '--colors-black': '#000',
    '--colors-dark-primary': 'white',
    '--colors-light-primary': 'black',
    '--space-0': '0px',
    '--space-1': '4px',
    '--space-2': '8px',
    '--space-3': '16px',
    '--borderWidths-0': '0px',
    '--borderWidths-1': '1px',
    '--borderWidths-2': '2px',
  },
  colors: {
    primary: 'var(--colors-primary)',
    secondary: 'var(--colors-secondary)',
    black: 'var(--colors-black)',
    dark: {
      primary: 'var(--colors-dark-primary)',
    },
    light: {
      primary: 'var(--colors-light-primary)',
    },
  },
  space: [
    'var(--space-0)',
    'var(--space-1)',
    'var(--space-2)',
    'var(--space-3)',
  ],
  borderWidths: [
    'var(--borderWidths-0)',
    'var(--borderWidths-1)',
    'var(--borderWidths-2)',
  ],
  layout: {
    spacing: {
      large: {
        margin: 3,
      },
    },
  },
  buttons: {
    base: {
      p: 3,
      paddingX: 2,
      borderWidth: 1,
    },
    primary: {
      backgroundColor: 'primary',
    },
  },
}
