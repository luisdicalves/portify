import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Portify',
  description: 'Gestão de portfólio de investimentos',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>
        {children}
      </body>
    </html>
  )
}
