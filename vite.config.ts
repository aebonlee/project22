import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// gh-pages 프로젝트 페이지(/<repo>/)에서도 자원 경로가 맞도록 상대 base 사용
export default defineConfig({
  plugins: [react()],
  base: './',
});
