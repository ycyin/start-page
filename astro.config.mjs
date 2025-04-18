import vercel from '@astrojs/vercel/serverless';
import {defineConfig} from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',   // Enable SSR
  adapter: vercel(),  // Use Vercel adapter
  integrations: [react()]
});