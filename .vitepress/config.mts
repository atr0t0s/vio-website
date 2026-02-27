import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vio',
  description: 'The AI-Agent-First Frontend Framework',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vio-logo.svg' }],
  ],
  cleanUrls: true,
  themeConfig: {
    logo: '/vio-logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/create-app' },
      { text: 'Devtools', link: '/devtools/overview' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Components', link: '/guide/components' },
            { text: 'State Management', link: '/guide/state-management' },
            { text: 'Routing', link: '/guide/routing' },
            { text: 'Event Bus', link: '/guide/event-bus' },
            { text: 'HTTP Client', link: '/guide/http-client' },
            { text: 'Forms', link: '/guide/forms' },
            { text: 'Batch Operations', link: '/guide/batch-operations' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'createApp', link: '/api/create-app' },
            { text: 'defineComponent', link: '/api/define-component' },
            { text: 'Store', link: '/api/store' },
            { text: 'Router', link: '/api/router' },
            { text: 'EventBus', link: '/api/event-bus' },
            { text: 'HttpClient', link: '/api/http-client' },
            { text: 'Forms', link: '/api/forms' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
      '/devtools/': [
        {
          text: 'Devtools',
          items: [
            { text: 'Overview', link: '/devtools/overview' },
            { text: 'Setup', link: '/devtools/setup' },
            { text: 'MCP Tools Reference', link: '/devtools/mcp-tools' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/atr0t0s/vio' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
