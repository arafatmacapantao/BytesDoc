import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import ToastViewport from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BytesDoc - Document Management System',
  description: 'Centralized Document Management for BYTES Student Council',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <ToastViewport />
          <ConfirmDialog />
        </ThemeProvider>
      </body>
    </html>
  )
}
