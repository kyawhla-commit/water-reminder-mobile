const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure mp3 and wav are in asset extensions (remove from source exts if present)
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mp3' && ext !== 'wav');
if (!config.resolver.assetExts.includes('mp3')) {
  config.resolver.assetExts.push('mp3');
}
if (!config.resolver.assetExts.includes('wav')) {
  config.resolver.assetExts.push('wav');
}

module.exports = config;
