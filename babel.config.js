module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // drizzle-kitが生成するマイグレーションSQL(.sql)を文字列としてバンドルに埋め込む
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
