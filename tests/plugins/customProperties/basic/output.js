export default {
  styles: {
    root: {
      '--theme-ui-colors-primary': 'red',
      '--theme-ui-colors-secondary': 'blue',
      '--theme-ui-colors-black': '#000',
      '--theme-ui-colors-dark-primary': 'white',
      '--theme-ui-colors-light-primary': 'black',
      '--theme-ui-space-0': '0px',
      '--theme-ui-space-1': '4px',
      '--theme-ui-space-2': '8px',
      '--theme-ui-space-3': '16px',
      '--theme-ui-borderWidths-0': '0px',
      '--theme-ui-borderWidths-1': '1px',
      '--theme-ui-borderWidths-2': '2px',
      fontSize: 1,
    },
  },
  colors: {
    primary: 'var(--theme-ui-colors-primary)',
    secondary: 'var(--theme-ui-colors-secondary)',
    black: 'var(--theme-ui-colors-black)',
    dark: {
      primary: 'var(--theme-ui-colors-dark-primary)',
    },
    light: {
      primary: 'var(--theme-ui-colors-light-primary)',
    },
  },
  space: [
    'var(--theme-ui-space-0)',
    'var(--theme-ui-space-1)',
    'var(--theme-ui-space-2)',
    'var(--theme-ui-space-3)',
  ],
  borderWidths: [
    'var(--theme-ui-borderWidths-0)',
    'var(--theme-ui-borderWidths-1)',
    'var(--theme-ui-borderWidths-2)',
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
      paddingX: [2, 3],
      borderWidth: 1,
    },
    primary: {
      backgroundColor: 'primary',
    },
  },
}
