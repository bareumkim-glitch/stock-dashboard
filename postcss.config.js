import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

// Safari 12.0 fallback: adds rgb(R, G, B) before rgb(R G B / var(...))
const legacyColorFallback = () => ({
  postcssPlugin: 'postcss-legacy-color-fallback',
  Declaration(decl) {
    if (/rgb\(\s*\d+\s+\d+\s+\d+\s*\/\s*var\(/.test(decl.value)) {
      const fallback = decl.value.replace(
        /rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*var\([^)]+\)\)/g,
        'rgb($1, $2, $3)'
      );
      if (fallback !== decl.value) {
        decl.cloneBefore({ value: fallback });
      }
    }
  }
});
legacyColorFallback.postcss = true;

export default {
  plugins: [
    tailwindcss(),
    legacyColorFallback(),
    postcssPresetEnv({
      stage: 3,
      features: {
        'color-functional-notation': true,
      },
      autoprefixer: false,
    }),
    autoprefixer(),
  ],
}
