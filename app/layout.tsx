import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/contexts/ThemeContext'
import LoadingBar from '@/components/LoadingBar'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'JalSetu',
  description: 'Agentic AI platform for India\'s water tanker economy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="hi" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-[#021B3A] text-slate-200 antialiased">
        <ThemeProvider>
          <LoadingBar />
          <div className="mx-auto max-w-[1200px] min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
