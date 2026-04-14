import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://caramelotech.github.io',
  base: '/web-dev-labs',
  integrations: [
    starlight({
      title: 'Web Dev Labs',
      customCss: ['./src/styles/custom.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/caramelotech/web-dev-labs',
        },
      ],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Portugues', lang: 'pt-BR' },
      },
    }),
  ],
});
