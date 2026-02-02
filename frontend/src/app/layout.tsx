import './globals.css'
import type { Metadata } from 'next'

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
      </body>
    </html>
  )
}
