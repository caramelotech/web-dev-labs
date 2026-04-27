import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://caramelotech.com.br",
  base: "/web-dev-labs",
  integrations: [
    starlight({
      title: "Caramelo Tech",
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/caramelotech",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/caramelotech/",
        },
        {
          icon: "instagram",
          label: "Instagram",
          href: "https://www.instagram.com/caramelo_tech/",
        },
      ],
      sidebar: [
        {
          label: "Fundamentos Web",
          autogenerate: { directory: "fundamentos" },
        },
        {
          label: "Backend",
          autogenerate: { directory: "backend" },
        },
        {
          label: "System Design",
          autogenerate: { directory: "system-design" },
        },
        {
          label: "Ferramentas",
          autogenerate: { directory: "ferramentas" },
        },
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "Portugues", lang: "pt-BR" },
      },
    }),
  ],
});
