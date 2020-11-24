export default {
  ':custom-properties': {
    '--colors-primary': 'red',
    '--colors-secondary': 'blue',
    '--colors-black': '#000',
    '--colors-dark-primary': 'white',
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
        margin: 'var(--space-3)',
      },
    },
  },
  buttons: {
    base: {
      p: 3,
      paddingX: 'var(--space-2)',
      borderWidth: 'var(--borderWidths-1)',
    },
    primary: {
      backgroundColor: 'var(--colors-primary)',
    },
  },
}
