import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transform } from 'esbuild'

// rolldown-vite가 build.target 트랜스파일을 완전히 지원하지 않으므로
// esbuild로 번들 결과물을 후처리하여 Safari 12 호환 문법으로 변환
function esbuildLegacyPlugin(target) {
  return {
    name: 'esbuild-legacy-transform',
    enforce: 'post',
    async renderChunk(code) {
      const result = await transform(code, {
        target,
        format: 'esm',
      })
      return { code: result.code, map: result.map }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    esbuildLegacyPlugin('safari12'),
  ],
  build: {
    target: 'safari12',
  },
})
