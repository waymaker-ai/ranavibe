import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">CoFounder UI</span>,
  project: {
    link: 'https://github.com/waymaker-ai/cofounder',
  },
  docsRepositoryBase: 'https://github.com/waymaker-ai/cofounder/tree/main/apps/cofounder-ui-docs',
  footer: {
    text: 'CoFounder UI - Built with CoFounder',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – CoFounder UI'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="CoFounder UI" />
      <meta property="og:description" content="Beautiful glass morphism component library for React" />
    </>
  ),
}

export default config
