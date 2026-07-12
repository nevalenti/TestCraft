// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://testcraft.dev",
  base: "/docs",
  redirects: {
    "/": "/docs/guides/getting-started/",
  },
  integrations: [
    starlight({
      title: "TestCraft",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: false,
      },
      expressiveCode: {
        themes: ["dracula"],
      },
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nevalenti/TestCraft",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "guides" } }],
        },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "reference" } }],
        },
      ],
    }),
  ],
});
