import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "de-DE",
  title: "SchuldKompass",
  description: "Anleitung fuer SchuldKompass",
  base: process.env.VITEPRESS_BASE ?? "/",
  cleanUrls: true,
  appearance: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Zur Anwendung", link: process.env.VITEPRESS_APP_URL ?? "http://localhost:5173/" },
      { text: "Anleitung", link: "/guide/" },
      { text: "Entwicklung", link: "/development/" },
      { text: "API", link: "/api/" },
      { text: "Changelog", link: "/changelog" },
    ],
    sidebar: [
      {
        text: "Loslegen",
        items: [
          { text: "Ueberblick", link: "/guide/" },
          { text: "Installation", link: "/guide/installation" },
          { text: "Schulden verwalten", link: "/guide/debts" },
          { text: "E-Mail", link: "/guide/email" },
        ],
      },
      {
        text: "Technik",
        items: [
          { text: "Entwicklung", link: "/development/" },
          { text: "GraphQL API", link: "/api/" },
          { text: "Changelog", link: "/changelog" },
        ],
      },
    ],
    socialLinks: [],
    search: {
      provider: "local",
    },
    footer: {
      message: "Private Schulden einfach im Blick behalten.",
      copyright: "SchuldKompass",
    },
  },
});
