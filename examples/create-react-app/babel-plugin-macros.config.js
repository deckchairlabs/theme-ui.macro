const path = require('path')
const customProperties = require('theme-ui.macro/plugins/customProperties').default
const generateStylesheet = require('theme-ui.macro/plugins/generateStylesheet').default
const typescriptDeclarations = require('theme-ui.macro/plugins/typescriptDeclarations').default

module.exports = {
    themeUI: {
        plugins: [
            customProperties({ prefix: 'theme-ui' }),
            generateStylesheet({
                selectors: { buttons: '.button' },
                output: path.join(__dirname, 'src/theme.css'),
            }),
            typescriptDeclarations({
                output: path.join(__dirname, 'src/theme.d.ts')
            })
        ]
    },
}