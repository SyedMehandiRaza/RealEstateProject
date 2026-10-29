// Used only by Jest (babel-jest) to run ESM source as CommonJS in tests.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
