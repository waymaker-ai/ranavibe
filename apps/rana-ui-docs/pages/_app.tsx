import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { inject } from '@vercel/analytics'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    inject()
  }, [])

  return <Component {...pageProps} />
}
