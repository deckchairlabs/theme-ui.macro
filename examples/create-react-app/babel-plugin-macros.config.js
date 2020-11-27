const path = require('path')

module.exports = {
    themeUI: {
        customProperties: { prefix: 'theme-ui' },
        generateStylesheet: {
            selectors: { buttons: '.button' },
            output: path.join(__dirname, 'src/theme.css'),
        },
        generateTSDeclaration: {
            output: path.join(__dirname, 'src/theme.d.ts')
        }
    },
}