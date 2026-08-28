const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Avoid broken subpath resolution for @react-navigation on some Windows setups
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
