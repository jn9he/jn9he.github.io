import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://jn9he.github.io',
  integrations: [react()],
  output: 'static',
});
