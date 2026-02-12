import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'

import './globals.css'

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'NakkoAI',
  description: 'AI chatbot with hyderabadi slang helping you clear doubts in an easy way!',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} font-mono antialiased bg-neutral-950 text-neutral-50`}>{children}</body>
    </html>
  )
}
