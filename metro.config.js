const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// drizzle-kitが生成するマイグレーションSQL(.sql)をimportできるようにする
config.resolver.sourceExts.push('sql');

module.exports = config;
