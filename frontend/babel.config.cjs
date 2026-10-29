// Used only by Jest (babel-jest). Vite does not read this file.

// Jest runs tests as CommonJS, but some dependencies (react-router, MSW's tree) ship ESM only.
// babel-jest compiles them; this plugin handles the two ESM-only features preset-env leaves in place:
//  - import(): babel-jest reports dynamic-import support, so it is kept; rewrite to require().
//  - import.meta (other than import.meta.env, handled by transform-vite-meta-env): CommonJS equivalent.
function esmOnlyFeaturesToCommonJs({ template, types: t }) {
  const buildImport = template.expression('Promise.resolve().then(() => require(SOURCE))');
  const buildImportMeta = template.expression.ast`({ url: require('url').pathToFileURL(__filename).href })`;
  return {
    name: 'jest-esm-only-features-to-commonjs',
    visitor: {
      ImportExpression(path) {
        path.replaceWith(buildImport({ SOURCE: path.node.source }));
      },
      CallExpression(path) {
        if (path.get('callee').isImport()) path.replaceWith(buildImport({ SOURCE: path.node.arguments[0] }));
      },
      MetaProperty(path) {
        if (t.isIdentifier(path.node.meta, { name: 'import' }))
          path.replaceWith(t.cloneNode(buildImportMeta));
      },
    },
  };
}

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: ['babel-plugin-transform-vite-meta-env', esmOnlyFeaturesToCommonJs],
};
