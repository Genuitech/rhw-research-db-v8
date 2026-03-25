import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RHW Research Database',
  description: 'AI-powered firm research with Entra SSO',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-400">
        {children}
      </body>
    </html>
  )
}
