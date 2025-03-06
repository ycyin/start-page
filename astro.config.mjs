import vercel from '@astrojs/vercel/serverless';
import {defineConfig} from 'astro/config';

export default defineConfig({
  output: 'server',   // Enable SSR
  adapter: vercel(),  // Use Vercel adapter
});