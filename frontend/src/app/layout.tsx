import './globals.css'
import type { Metadata } from 'next'
import ReduxProvider from '@/lib/store/provider'

export const metadata: Metadata = {
  title: 'Drivana - Car Rental Platform',
  description: 'Rent cars with optional driver service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  )
}
