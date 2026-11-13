// @ts-check
import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://testcraft.pro",
  base: "/docs",
  redirects: {
    "/": "/docs/guides/getting-started/",
  },
  integrations: [
    starlight({
      title: "TestCraft",
      logo: {
        src: "./src/assets/logo-dark.svg",
        replacesTitle: false,
      },
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      expressiveCode: {
        themes: ["dracula"],
        styleOverrides: {
          frames: {
            inlineButtonForeground: "var(--sl-color-accent)",
            inlineButtonBackgroundIdleOpacity: "0.1",
            inlineButtonBackgroundHoverOrFocusOpacity: "0.22",
            inlineButtonBackgroundActiveOpacity: "0.32",
            inlineButtonBorderOpacity: "0.6",
          },
        },
      },
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nevalenti/TestCraft",
        },
      ],
      sidebar: [{ slug: "guides/getting-started" }, { slug: "guides/hosting" }],
    }),
    mdx(),
  ],
});
