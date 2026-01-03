import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Intake + Mini PRD',
  description: 'Treino de Intake + Mini PRD',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

