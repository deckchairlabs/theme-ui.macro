export default {
  ':root': {
    '--colors-primary': 'red',
    '--colors-secondary': 'blue',
    '--colors-black': '#000',
    '--space-0': '0px',
    '--space-1': '4px',
    '--space-2': '8px',
    '--space-3': '16px',
  },
  colors: {
    primary: 'red',
    secondary: 'blue',
    black: '#000',
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      padding: 'var(--space-2)',
    },
    primary: {
      padding: ['var(--space-2)', 'var(--space-4)'],
      backgroundColor: 'var(--colors-primary)',
    },
  },
}
