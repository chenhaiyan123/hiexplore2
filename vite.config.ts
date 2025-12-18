
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(cwd, './'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    // 兼容性构建配置
    build: {
      target: 'es2015',
    },
    server: {
      host: true, // 开启局域网访问，允许手机连接
      port: 5173,
      proxy: {
        '/qwen-api': {
          target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          changeOrigin: true,
          secure: false, 
          rewrite: (path) => path.replace(/^\/qwen-api/, ''),
        },
        '/deepseek-api': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/deepseek-api/, ''),
        },
        '/google-api': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/google-api/, ''),
        },
      },
    },
  };
});
