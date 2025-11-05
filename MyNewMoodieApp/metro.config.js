const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If the bundler requests 'tslib', resolve it to the ESM build for correct import
  if (moduleName === 'tslib') {
    return context.resolveRequest(context, require.resolve('tslib/tslib.es6.js'), platform);
  }
  // Otherwise, use Expo's default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
