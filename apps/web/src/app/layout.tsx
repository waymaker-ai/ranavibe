import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from './analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RANA - Rapid AI Native Architecture',
  description: 'Build production-quality products with AI assistants through proven quality gates and strategic validation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
