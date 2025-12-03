import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">RANA UI</span>,
  project: {
    link: 'https://github.com/waymaker-ai/ranavibe',
  },
  docsRepositoryBase: 'https://github.com/waymaker-ai/ranavibe/tree/main/apps/rana-ui-docs',
  footer: {
    text: 'RANA UI - Built with RANA',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – RANA UI'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="RANA UI" />
      <meta property="og:description" content="Beautiful glass morphism component library for React" />
    </>
  ),
}

export default config
