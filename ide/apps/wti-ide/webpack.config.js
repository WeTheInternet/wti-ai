/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
// @ts-check
const configs = require('./gen-webpack.config.js');
const nodeConfig = require('./gen-webpack.node.config.js');

/**
 * Expose bundled modules on window.theia.moduleName namespace, e.g.
 * window['theia']['@theia/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
configs[0].module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@theia/application-manager/lib/expose-loader')
}); */

configs[0].plugins.unshift(
    new (require('copy-webpack-plugin'))({
        patterns: [
            {
                from: require('path').resolve(__dirname, 'extensions'),
                to: require('path').resolve(__dirname, 'lib', 'frontend', 'extensions'),
                noErrorOnMissing: true
            }
        ]
    })
);

module.exports = [
    ...configs,
    nodeConfig.config
];
