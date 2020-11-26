const path = require('path')
const customProperties = require('theme-ui.macro/plugins/customProperties').default
const typescriptDeclarations = require('theme-ui.macro/plugins/typescriptDeclarations').default

module.exports = {
    themeUI: {
        plugins: [customProperties({ prefix: 'theme-ui' }), typescriptDeclarations({
            output: path.join(__dirname, 'src/theme.d.ts')
        })]
    },
}