// Used only by Jest (babel-jest) so tests can use jest.mock with ESM source.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
