import { defineConfig } from 'vitepress'

// Docs are published under /docs/ of the same Pages artifact as the app:
// https://azurelocal.cloud/azurelocal-draftsman/docs/
export default defineConfig({
  base: '/azurelocal-draftsman/docs/',
  title: 'Azure Local Draftsman',
  description: 'Cabling and compliance diagramming for Azure Local network architectures',
  srcExclude: ['node_modules/**'],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Open the app', link: 'https://azurelocal.cloud/azurelocal-draftsman/' },
      { text: 'Compliance auditor', link: '/compliance-auditor' },
      { text: 'Comparison with Trailwright', link: '/drawio-export' }
    ],
    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Cabling standards', link: '/cabling-standards' },
          { text: 'Logical networks and VLANs', link: '/logical-hci-vlans' },
          { text: 'Network ATC intents', link: '/network-atc-intents' },
          { text: 'Compliance auditor', link: '/compliance-auditor' },
          { text: 'Schedule exporters', link: '/schedule-exporters' },
          { text: 'draw.io export', link: '/drawio-export' },
          { text: 'Guided setup wizard', link: '/guided-setup-wizard' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/AzureLocal/azurelocal-draftsman' }
    ],
    footer: {
      message: 'Released under the MIT License. Forked from AzLoFlows by Cristian Edwards Sabathe.',
      copyright: 'Copyright (c) Cristian Edwards Sabathe (AzLoFlows) and AzureLocal contributors'
    }
  }
})
