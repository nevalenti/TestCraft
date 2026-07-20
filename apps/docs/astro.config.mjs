// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://testcraft.pro",
  base: "/docs",
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
