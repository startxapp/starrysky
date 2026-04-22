import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/starrysky.esm.js',
      format: 'es'
    },
    {
      file: 'dist/starrysky.umd.js',
      format: 'umd',
      name: 'Starrysky'
    },
    {
      file: 'dist/starrysky.min.js',
      format: 'umd',
      name: 'Starrysky',
      plugins: [terser()]
    }
  ],
  plugins: [resolve()]
};